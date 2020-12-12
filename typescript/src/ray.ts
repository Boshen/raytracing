import { Vec3 } from './vec3'
import { Model, Hittable } from './model'

export interface HitRay {
  ray: Ray
  point: Vec3
  hittable: Hittable
  distance: number
}

export interface HitModel extends HitRay {
  model: Model
}

export class Ray {
  constructor(public start: Vec3, public direction: Vec3) {}

  getPoint(distance: number): Vec3 {
    return this.start.add(this.direction.scale(distance))
  }
}
