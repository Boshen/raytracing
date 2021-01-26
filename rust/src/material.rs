use nalgebra::{Dot, Norm};
use std::ops::{Add, Mul, Sub};

use crate::brdf::{GlossySpecular, Lambertian, PerfectSpecular, BRDF};
use crate::model::{Color, Vec3};
use crate::ray::{Ray, RayHit};

pub enum Material {
    Matte(Matte),
    Phong(Phong),
    Reflective(Reflective),
}

pub struct Matte {
    pub ambient_brdf: Lambertian,
    pub diffuse_brdf: Lambertian,
}

pub struct Phong {
    pub ambient_brdf: Lambertian,
    pub diffuse_brdf: Lambertian,
    pub specular_brdf: GlossySpecular,
}

pub struct Reflective {
    pub ambient_brdf: Lambertian,
    pub diffuse_brdf: Lambertian,
    pub specular_brdf: GlossySpecular,
    pub reflective_brdf: PerfectSpecular,
}

impl Matte {
    pub fn new(ambient_brdf: Lambertian, diffuse_brdf: Lambertian) -> Matte {
        return Matte {
            ambient_brdf,
            diffuse_brdf,
        };
    }
}

impl Phong {
    pub fn new(
        ambient_brdf: Lambertian,
        diffuse_brdf: Lambertian,
        specular_brdf: GlossySpecular,
    ) -> Phong {
        if diffuse_brdf.kd + specular_brdf.ks >= 1.0 {
            panic!("kd + ks >= 1.0 in Phong Constructor");
        }
        return Phong {
            ambient_brdf,
            diffuse_brdf,
            specular_brdf,
        };
    }
}

impl Reflective {
    pub fn new(
        ambient_brdf: Lambertian,
        diffuse_brdf: Lambertian,
        specular_brdf: GlossySpecular,
        reflective_brdf: PerfectSpecular,
    ) -> Reflective {
        return Reflective {
            ambient_brdf,
            diffuse_brdf,
            specular_brdf,
            reflective_brdf,
        };
    }
}

impl Material {
    pub fn shade(&self, hit: &RayHit) -> Color {
        let ambient_color = self.ambient_color(hit);
        return hit
            .world
            .lights
            .iter()
            .map(|light| {
                // wi: incoming direction
                // ndotwi: angle between light and normal
                let wi = light.get_direction(hit);
                let ndotwi = hit.normal.dot(&wi);
                // not hit by light
                if ndotwi <= 0.0 {
                    return Color::new(0.0, 0.0, 0.0);
                }
                // wo: reflected direction
                let wo = hit.ray.dir.mul(-1.0).normalize();
                let c = self
                    .diffuse_color(hit, &wo, &wi)
                    .add(self.specular_color(hit, &wo, &wi))
                    .mul(light.radiance(hit))
                    .mul(ndotwi)
                    .add(self.reflective_color(hit, &wo));
                return c;
            })
            .fold(ambient_color, |a, b| a.add(b));
    }

    fn ambient_color(&self, hit: &RayHit) -> Color {
        let rho = match self {
            Material::Matte(m) => m.diffuse_brdf.rho(),
            Material::Phong(m) => m.ambient_brdf.rho(),
            Material::Reflective(m) => m.ambient_brdf.rho(),
        };
        return rho.mul(hit.world.ambient_light.radiance(hit));
    }

    fn diffuse_color(&self, hit: &RayHit, wo: &Vec3, wi: &Vec3) -> Color {
        let z = Vec3::new(0.0, 0.0, 0.0);
        return match self {
            Material::Matte(m) => m.diffuse_brdf.f(hit, &z, &z),
            Material::Phong(m) => m.diffuse_brdf.f(hit, wo, wi),
            Material::Reflective(m) => m.diffuse_brdf.f(hit, wo, wi),
        };
    }

    fn specular_color(&self, hit: &RayHit, wo: &Vec3, wi: &Vec3) -> Color {
        let z = Vec3::new(0.0, 0.0, 0.0);
        return match self {
            Material::Matte(_) => z,
            Material::Phong(m) => m.specular_brdf.f(hit, wo, wi),
            Material::Reflective(m) => m.specular_brdf.f(hit, wo, wi),
        };
    }

    fn reflective_color(&self, hit: &RayHit, wo: &Vec3) -> Color {
        let z = Vec3::new(0.0, 0.0, 0.0);
        return match self {
            Material::Matte(_) => z,
            Material::Phong(_) => z,
            Material::Reflective(m) => {
                let normal = hit.normal;
                let ndotwo = normal.dot(&wo);
                let wi = normal.mul(2.0 * ndotwo).sub(wo);
                let fr = m.reflective_brdf.sample_f(hit, &wo, &wi);
                let reflected_ray = Ray::new(hit.hit_point, wi);
                return hit
                    .world
                    .trace(&reflected_ray, hit.depth + 1)
                    .mul(fr)
                    .mul(normal.dot(&wi));
            }
        };
    }
}
