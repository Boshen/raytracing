use nalgebra::Point3;

pub mod simple;
pub mod thin_lens;

use crate::color::Color;
use crate::model::Vec3;
use crate::world::World;

pub use simple::*;
pub use thin_lens::*;

pub enum CameraEnum {
    SimpleCamera,
    ThinLensCamera,
}

pub trait Camera {
    fn render_scene(&self, world: &World) -> Vec<Color>;
}

pub struct CameraSetting {
    pub up: Vec3,
    pub eye: Point3<f64>,
    pub u: Vec3,
    pub v: Vec3,
    pub w: Vec3,
    pub view_plane_distance: f64,
    sample_points_sqrt: usize,
}

impl CameraSetting {
    pub fn new(eye: Point3<f64>, lookat: Point3<f64>, view_plane_distance: f64) -> CameraSetting {
        let up = Vec3::new(0.0, 1.0, 0.0);
        let w = (eye - lookat).normalize();
        let u = up.cross(&w).normalize();
        let v = w.cross(&u).normalize();
        CameraSetting {
            eye,
            w,
            u,
            v,
            up,
            view_plane_distance,
            sample_points_sqrt: 4,
        }
    }
}
