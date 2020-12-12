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
  inverseDirection: Vec3

  constructor(public start: Vec3, public direction: Vec3) {
    this.inverseDirection = new Vec3(1 / direction.x, 1 / direction.y, 1 / direction.z)
  }

  getPoint(distance: number): Vec3 {
    return this.start.add(this.direction.scale(distance))
  }
}
