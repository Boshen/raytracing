use nalgebra::Point3;
use num_traits::identities::Zero;
use rand::{thread_rng, Rng};

use crate::aabb::AABB;
use crate::geometric_object::GeometricObject;
use crate::model::Vec3;
use crate::ray::{HitRecord, Ray};

pub struct BvhNode {
    pub children: Vec<Box<dyn GeometricObject>>,
    pub aabb: AABB,
}

impl GeometricObject for BvhNode {
    fn intersects(&self, ray: &Ray, t_min: f64, t_max: f64) -> Option<HitRecord> {
        if !self.aabb.intersects(ray, t_min, t_max) {
            return None;
        }
        let mut tmax = t_max;
        let mut hit_record = None;
        for o in self.children.iter() {
            if let Some(record) = o.intersects(ray, t_min, tmax) {
                hit_record = Some(record);
                tmax = record.dist;
            }
        }
        hit_record
    }

    fn scale(&mut self, _l: f64) {}

    fn normal(&self, _p: &Vec3) -> Vec3 {
        Vec3::zero()
    }

    fn get_center(&self) -> Vec3 {
        Vec3::zero()
    }

    fn get_min_point(&self) -> Point3<f64> {
        self.aabb.min
    }

    fn get_max_point(&self) -> Point3<f64> {
        self.aabb.max
    }

    fn get_bounding_box(&self) -> AABB {
        AABB::new(self.get_min_point(), self.get_max_point())
    }

    fn get_samples(&self, _sample_points_sqrt: usize) -> Vec<Vec3> {
        vec![]
    }

    fn get_material_id(&self) -> usize {
        0
    }
}

impl BvhNode {
    pub fn new(objects: &mut Vec<Box<dyn GeometricObject>>) -> Box<dyn GeometricObject> {
        let axis = thread_rng().gen_range(0, 3);
        let comparator = move |a: &Box<dyn GeometricObject>, b: &Box<dyn GeometricObject>| {
            let box_a = a.get_bounding_box();
            let box_b = b.get_bounding_box();
            box_a.min[axis].partial_cmp(&box_b.min[axis]).unwrap()
        };

        if objects.len() == 1 {
            objects.remove(0)
        } else {
            objects.sort_by(comparator);
            let mid = objects.len() / 2.0 as usize;
            let mut v2 = objects.split_off(mid);
            let left = BvhNode::new(objects);
            let right = BvhNode::new(&mut v2);
            let box_left = left.get_bounding_box();
            let box_right = right.get_bounding_box();
            Box::new(BvhNode {
                children: vec![left, right],
                aabb: AABB::get_surrounding_aabb(&box_left, &box_right),
            })
        }
    }
}
