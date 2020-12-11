import { Vec3 } from './vec3'

export interface HitRay {
  ray: Ray
  point: Vec3
  // normal: Vec3
  distance: number
}

export class Ray {
  constructor(public start: Vec3, public direction: Vec3) {}

  getPoint(distance: number): Vec3 {
    return this.start.add(this.direction.scale(distance))
  }
}

