extern crate tobj;
use std::collections::HashMap;

use crate::brdf::{GlossySpecular, Lambertian, PerfectSpecular};
use crate::color::Color;
use crate::geometric_object::{GeometricObject, Sphere, Triangle};
use crate::light::{AreaLight, Light};
use crate::material::{Emissive, Material, Matte, Reflective};
use crate::model::Vec3;

pub struct Object {
    pub name: String,
    pub vertices: Vec<Vec3>,
    pub face_indexes: Vec<(usize, usize, usize)>,
}

pub struct Asset {
    pub objects: Vec<Object>,
    pub geometries: Vec<Box<dyn GeometricObject>>,
    pub lights: Vec<Box<dyn Light>>,
    pub materials: HashMap<usize, Box<Material>>,
}

impl Asset {
    pub fn new(file_name: &str) -> Asset {
        let mut asset = Asset {
            objects: vec![],
            geometries: vec![],
            lights: vec![],
            materials: HashMap::new(),
        };

        let (models, materials) = tobj::load_obj(&file_name, true).expect("Failed to load file");

        let scale = 555.0;

        for model in models.iter() {
            let mesh = &model.mesh;
            let mut vertices: Vec<Vec3> = vec![];
            for v in 0..mesh.positions.len() / 3 {
                vertices.push(Vec3::new(
                    mesh.positions[3 * v] as f64,
                    mesh.positions[3 * v + 1] as f64,
                    mesh.positions[3 * v + 2] as f64,
                ));
            }

            let mut triangles: Vec<Box<dyn GeometricObject>> = vec![];

            match mesh.material_id {
                None => {}
                Some(material_id) => {
                    let m = &materials[material_id];
                    let ambient = Color::new(
                        m.ambient[0] as f64,
                        m.ambient[1] as f64,
                        m.ambient[2] as f64,
                    );
                    let diffuse = Color::new(
                        m.diffuse[0] as f64,
                        m.diffuse[1] as f64,
                        m.diffuse[2] as f64,
                    );
                    let material = if m.ambient[0] > 1.0 {
                        let emissive = Emissive::new(m.ambient[0] as f64, diffuse);
                        Material::Emissive(emissive)
                    } else {
                        let ambient_brdf = Lambertian::new(0.5, ambient);
                        let diffuse_brdf = Lambertian::new(1.0, diffuse);
                        Material::Matte(Matte::new(ambient_brdf, diffuse_brdf))
                    };

                    let mut next_face = 0;
                    for f in 0..mesh.num_face_indices.len() {
                        let end = next_face + mesh.num_face_indices[f] as usize;
                        let face_indices: Vec<_> = mesh.indices[next_face..end].iter().collect();
                        let triangle = Triangle::new(
                            material_id,
                            vertices[*face_indices[0] as usize],
                            vertices[*face_indices[1] as usize],
                            vertices[*face_indices[2] as usize],
                            scale,
                        );
                        let triangle2 = Triangle::new(
                            material_id,
                            vertices[*face_indices[0] as usize],
                            vertices[*face_indices[1] as usize],
                            vertices[*face_indices[2] as usize],
                            scale,
                        );
                        triangles.push(Box::new(triangle));
                        asset.geometries.push(Box::new(triangle2));
                        next_face = end;
                    }

                    if m.ambient[0] > 1.0 {
                        let emissive = Emissive::new(m.ambient[0] as f64, diffuse);
                        let arealight = AreaLight::new(triangles, emissive);
                        asset.lights.push(Box::new(arealight));
                    }

                    asset.materials.insert(material_id, Box::new(material));
                }
            };
        }

        let material = Material::Reflective(Reflective::new(
            Lambertian::new(0.1, Color::new(1.0, 1.0, 1.0)),
            Lambertian::new(0.1, Color::new(1.0, 1.0, 1.0)),
            GlossySpecular::new(0.2, 2.0),
            PerfectSpecular::new(0.5, Color::new(1.0, 1.0, 1.0)),
        ));
        let material_id = 1000 as usize;
        asset.geometries.push(Box::new(Sphere::new(
            material_id,
            40.0,
            Vec3::new(400.0, 40.0, 500.0),
            scale,
        )));
        asset.materials.insert(material_id, Box::new(material));
        asset
    }
}
