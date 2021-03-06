use nalgebra::Norm;
use nalgebra::Point3;
use num_traits::One;
use std::ops::{MulAssign, SubAssign};

use crate::aabb::AABB;
use crate::geometric_object::GeometricObject;
use crate::model::Vec3;
use crate::ray::{HitRecord, Ray};

pub struct Sphere {
    radius: f64,
    center: Vec3,
    material_id: usize,
}

impl Sphere {
    pub fn new(material_id: usize, radius: f64, center: Vec3, scale: f64) -> Sphere {
        let mut sphere = Sphere {
            material_id,
            radius,
            center,
        };
        sphere.scale(scale);
        sphere
    }
}

impl GeometricObject for Sphere {
    fn intersects(&self, ray: &Ray, t_min: f64, t_max: f64) -> Option<HitRecord> {
        let center = self.center;
        let radius = self.radius;
        let start = ray.origin;
        let dx = ray.dir.x;
        let dy = ray.dir.y;
        let dz = ray.dir.z;

        let a = dx * dx + dy * dy + dz * dz;
        let b = 2.0 * dx * (start.x - center.x)
            + 2.0 * dy * (start.y - center.y)
            + 2.0 * dz * (start.z - center.z);
        let c = center.x * center.x
            + center.y * center.y
            + center.z * center.z
            + start.x * start.x
            + start.y * start.y
            + start.z * start.z
            - 2.0 * (center.x * start.x + center.y * start.y + center.z * start.z)
            - radius * radius;

        let disc = b * b - 4.0 * a * c;

        if disc < 0.0 {
            return None;
        }

        let t = (-b - disc.sqrt()) / (2.0 * a);
        if t < 0.0 {
            return None;
        }
        if t < t_min || t > t_max {
            return None;
        }

        let hit_point = ray.get_point(t);
        Some(HitRecord {
            dist: t,
            hit_point,
            normal: self.normal(&hit_point),
            material_id: self.material_id,
        })
    }

    fn scale(&mut self, l: f64) {
        self.center.mul_assign(2.0 / l);
        self.center.sub_assign(Vec3::one());
        self.center.mul_assign(-1.0);
        self.radius = (self.radius * 2.0) / l;
    }

    fn normal(&self, p: &Vec3) -> Vec3 {
        ((p - self.center) / self.radius).normalize()
    }

    fn get_center(&self) -> Vec3 {
        self.center
    }

    fn get_min_point(&self) -> Point3<f64> {
        (self.center - self.radius).to_point()
    }

    fn get_max_point(&self) -> Point3<f64> {
        (self.center + self.radius).to_point()
    }

    fn get_bounding_box(&self) -> AABB {
        AABB::new(self.get_min_point(), self.get_max_point())
    }

    fn get_samples(&self, _sample_points_sqrt: usize) -> Vec<Vec3> {
        vec![]
    }

    fn get_material_id(&self) -> usize {
        self.material_id
    }
}
