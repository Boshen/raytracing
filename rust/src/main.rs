#![allow(dead_code)]
#![allow(clippy::many_single_char_names)]

use image::RgbImage;
use std::error::Error;

mod aabb;
mod asset;
mod brdf;
mod camera;
mod color;
mod geometric_object;
mod light;
mod material;
mod model;
mod ray;
mod sampler;
mod view_plane;
mod world;

use crate::asset::Asset;
use crate::camera::{Camera, CameraSetting, ThinLensCamera};
use crate::color::to_rgb;
use crate::geometric_object::BvhNode;
use crate::light::{AmbientLight, AmbientOcculuder, Light};
use crate::model::Vec3;
use crate::view_plane::ViewPlane;
use crate::world::World;

fn main() -> Result<(), Box<dyn Error>> {
    let mut asset = Asset::new("../assets/cornell_box.obj");

    let ambient_light = AmbientLight {
        ls: 0.1,
        cl: Vec3::new(1.0, 1.0, 1.0),
    };

    let lights: Vec<Box<dyn Light>> = vec![Box::new(AmbientOcculuder {
        ls: 1.0,
        cl: Vec3::new(1.0, 1.0, 1.0),
        sample_points_sqrt: 4,
    })];

    let vp = ViewPlane {
        hres: 500,
        vres: 500,
        pixel_size: 1.0,
    };

    let world = World {
        vp,
        hittable: BvhNode::create(&mut asset.geometries),
        lights: lights
            .into_iter()
            .chain(asset.lights.into_iter())
            .collect::<Vec<Box<dyn Light>>>(),
        ambient_light,
        materials: asset.materials,
    };

    let camera = ThinLensCamera {
        setting: CameraSetting::new(Vec3::new(0.0, 0.0, -3.0), Vec3::new(0.0, 0.0, 0.0), 500.0),
        lens_radius: 0.001, // 0 = simple camera with no blur
        focal_plane_distance: 500.0,
    };

    let pixels = camera
        .render_scene(&world)
        .iter()
        .flat_map(to_rgb)
        .collect();

    RgbImage::from_vec(vp.hres, vp.vres, pixels)
        .unwrap()
        .save("output.png")?;

    Ok(())
}
