use nalgebra::Norm;
use std::ops::{Mul, Sub};

use crate::light::{is_in_shadow, Light};
use crate::model::{Color, Model, Vec3};
use crate::ray::RayHit;
use crate::sampler::get_unit_square_sampler;

pub struct AreaLight {
    pub ls: f64,
    pub cl: Color,
    pub location: Vec3,
    pub width: f64,
    pub height: f64,
    pub sample_points_sqrt: u32,
}

impl Light for AreaLight {
    fn radiance(&self, hit: &RayHit) -> Color {
        let shadow_amount = self.intensity_at(&hit.hit_point, &hit.scene.models);
        return self.cl.mul(self.ls).mul(shadow_amount);
    }

    fn get_direction(&self, hit: &RayHit) -> Vec3 {
        return self.location.sub(hit.hit_point).normalize();
    }
}

impl AreaLight {
    fn intensity_at(&self, point: &Vec3, models: &Vec<Model>) -> f64 {
        let x = self.location.x - self.width / 2.0;
        let z = self.location.z - self.height / 2.0;
        return get_unit_square_sampler(self.sample_points_sqrt)
            .map(|(dx, dz)| {
                let new_location =
                    Vec3::new(x + dx * self.width, self.location.y, z + dz * self.width);
                let dir = new_location.sub(point).normalize();
                return if is_in_shadow(&point, &dir, &models) {
                    0.0
                } else {
                    1.0
                };
            })
            .sum::<f64>()
            / (self.sample_points_sqrt as f64 * self.sample_points_sqrt as f64);
    }
}
