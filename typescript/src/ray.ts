import { Vec3 } from './vec3'
import { Triangle } from './triangle'

export interface HitRay {
  ray: Ray
  point: Vec3
  model: Triangle
  distance: number
}

export class Ray {
  constructor(public start: Vec3, public direction: Vec3) {}

  getPoint(distance: number): Vec3 {
    return this.start.add(this.direction.scale(distance))
  }
}
