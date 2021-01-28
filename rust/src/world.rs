use nalgebra::{Dot, Norm};
use num_traits::identities::Zero;
use std::ops::{Add, Mul};

use crate::color::Color;
use crate::light::Light;
use crate::material::Material;
use crate::model::{Model, Vec3};
use crate::ray::{Ray, RayHit};

pub struct World {
    pub width: u32,
    pub height: u32,
    pub lights: Vec<Box<dyn Light>>,
    pub models: Vec<Model>,
    pub ambient_light: Box<dyn Light>,
}

impl World {
    pub fn trace(&self, ray: &Ray, depth: i32) -> Color {
        if depth >= 15 {
            return Color::zero();
        }
        let intersection = self
            .models
            .iter()
            .filter(|model| model.aabb.intersects(&ray))
            .flat_map(|model| {
                model
                    .hittables
                    .iter()
                    .map(move |hittable| (model, hittable))
            })
            .filter_map(|(model, hittable)| {
                hittable.intersects(ray).map(|dist| (dist, model, hittable))
            })
            .min_by(|t1, t2| (t1.0).partial_cmp(&t2.0).expect("Tried to compare a NaN"));

        return intersection.map_or(Color::zero(), |(distance, model, hittable)| {
            let point = ray.get_point(distance);

            let normal = hittable.normal(&point);
            // revert normal if we hit the inside surface
            let wo = ray.dir.mul(-1.0).normalize();
            let adjusted_normal = if normal.dot(&wo) < 1.0 {
                normal.mul(-1.0)
            } else {
                normal
            };
            let rayhit = RayHit {
                ray: ray,
                hit_point: point,
                material: &model.material,
                hittable: &hittable,
                world: &self,
                normal: adjusted_normal,
                depth: depth,
            };
            return model.material.shade(&rayhit);
        });
    }

    pub fn is_in_shadow(&self, point: &Vec3, dir: &Vec3) -> bool {
        let shadow_ray = Ray::new(point.add(dir.mul(0.00001)), *dir);
        return self
            .models
            .iter()
            .filter(|m| {
                if let Material::Emissive(_) = *m.material {
                    false
                } else {
                    true
                }
            })
            .filter(|m| m.aabb.intersects(&shadow_ray))
            .flat_map(|m| m.hittables.iter())
            .any(|h| h.intersects(&shadow_ray).is_some());
    }
}
