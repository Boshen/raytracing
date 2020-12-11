import { Ray, HitRay } from './ray'
import { Vec3 } from './vec3'
import { Material } from './material'

export class Triangle {
  public normal: Vec3

  constructor(public v0: Vec3, public v1: Vec3, public v2: Vec3, public material: Material) {
    this.normal = this.getNormal()
  }

  getNormal() {
    const e1 = this.v1.sub(this.v0)
    const e2 = this.v2.sub(this.v0)
    return e2.cross(e1).unit()
  }

  // Möller–Trumbore intersection algorithm
  public intersects(ray: Ray): HitRay | null {
    const EPSILON = 0.000001
    const e1 = this.v1.sub(this.v0)
    const e2 = this.v2.sub(this.v0)

    const h = ray.direction.cross(e2)
    const a = e1.dot(h)
    if (a > -EPSILON && a < EPSILON) {
      return null
    }

    const f = 1 / a
    const s = ray.start.sub(this.v0)
    const u = f * s.dot(h)
    if (u < 0 || u > 1) {
      return null
    }

    const q = s.cross(e1)
    const v = f * ray.direction.dot(q)

    if (v < 0 || u + v > 1) {
      return null
    }

    const t = f * e2.dot(q)
    if (t <= EPSILON) {
      return null
    }

    return {
      ray,
      point: ray.getPoint(t),
      distance: t,
    }
  }

  scale(L: number) {
    this.v0 = this.v0.scale(2 / L)
    this.v1 = this.v1.scale(2 / L)
    this.v2 = this.v2.scale(2 / L)

    this.v0 = this.v0.sub(new Vec3(1, 1, 1))
    this.v1 = this.v1.sub(new Vec3(1, 1, 1))
    this.v2 = this.v2.sub(new Vec3(1, 1, 1))

    this.v0.x = this.v0.x * -1
    this.v1.x = this.v1.x * -1
    this.v2.x = this.v2.x * -1

    this.v0.y = this.v0.y * -1
    this.v1.y = this.v1.y * -1
    this.v2.y = this.v2.y * -1

    this.normal = this.getNormal()
  }
}
