use nalgebra::Norm;
use std::ops::{Mul, Sub};

use crate::color::Color;
use crate::light::Light;
use crate::model::Vec3;
use crate::ray::RayHit;

pub struct PointLight {
    pub ls: f64,
    pub cl: Color,
    pub location: Vec3,
}

impl Light for PointLight {
    fn get_direction(&self, hit: &RayHit) -> Vec3 {
        return self.location.sub(hit.hit_point).normalize();
    }

    fn radiance(&self, _hit: &RayHit) -> Color {
        return self.cl.mul(self.ls);
    }

    fn shadow_amount(&self, hit: &RayHit) -> f64 {
        let direction = self.location.sub(hit.hit_point).normalize();
        return if hit.world.is_in_shadow(&hit.hit_point, &direction) {
            0.0
        } else {
            1.0
        };
    }
}
