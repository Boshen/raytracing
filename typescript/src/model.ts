import { Ray, HitRay } from './ray'
import { Vec3 } from './vec3'
import { Material } from './material'
import { stats } from './stats'
import { AABB } from './aabb'

export class Model {
  aabb: AABB = new AABB([])
  constructor(public material: Material, public hittables: Hittable[]) {
  }

  scale(L: number) {
    this.hittables.forEach((h) => h.scale(L))
    this.aabb = new AABB(this.hittables)
  }
}

export abstract class Hittable {
  abstract normal(p: Vec3): Vec3
  abstract intersects(ray: Ray): HitRay | null
  abstract scale(L: number): void
  abstract getMinPoint(): Vec3
  abstract getMaxPoint(): Vec3
}

export class Triangle extends Hittable {
  private _normal: Vec3

  constructor(public v0: Vec3, public v1: Vec3, public v2: Vec3) {
    super()
    this._normal = this.computeNormal()
  }

  normal(_p: Vec3) {
    return this._normal
  }

  computeNormal() {
    const e1 = this.v1.sub(this.v0)
    const e2 = this.v2.sub(this.v0)
    return e2.cross(e1).unit()
  }

  getMinPoint() {
    return new Vec3(
      Math.min(...[this.v0.x, this.v1.x, this.v2.x]),
      Math.min(...[this.v0.y, this.v1.y, this.v2.y]),
      Math.min(...[this.v0.z, this.v1.z, this.v2.z]),
    )
  }

  getMaxPoint() {
    return new Vec3(
      Math.max(...[this.v0.x, this.v1.x, this.v2.x]),
      Math.max(...[this.v0.y, this.v1.y, this.v2.y]),
      Math.max(...[this.v0.z, this.v1.z, this.v2.z]),
    )
  }

  // Möller–Trumbore intersection algorithm
  intersects(ray: Ray): HitRay | null {
    stats.intersectionCount += 1

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
      hittable: this,
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

    this.v0.x = -this.v0.x
    this.v1.x = -this.v1.x
    this.v2.x = -this.v2.x

    this.v0.y = -this.v0.y
    this.v1.y = -this.v1.y
    this.v2.y = -this.v2.y
    this._normal = this.computeNormal()
  }
}

export class Sphere extends Hittable {
  constructor(public center: Vec3, public radius: number) {
    super()
  }

  normal(p: Vec3) {
    return p
      .sub(this.center)
      .scale(1 / this.radius)
      .unit()
  }

  getMinPoint() {
    return this.center.translate(-this.radius)
  }

  getMaxPoint() {
    return this.center.translate(this.radius)
  }

  intersects(ray: Ray) {
    stats.intersectionCount += 1

    const center = this.center
    const radius = this.radius
    const start = ray.start
    const dx = ray.direction.x
    const dy = ray.direction.y
    const dz = ray.direction.z

    const a = dx * dx + dy * dy + dz * dz
    const b = 2 * dx * (start.x - center.x) + 2 * dy * (start.y - center.y) + 2 * dz * (start.z - center.z)
    const c =
      center.x * center.x +
      center.y * center.y +
      center.z * center.z +
      start.x * start.x +
      start.y * start.y +
      start.z * start.z -
      2 * (center.x * start.x + center.y * start.y + center.z * start.z) -
      radius * radius

    const disc = b * b - 4 * a * c

    if (disc < 0) {
      return null
    }

    const t = (-b - Math.sqrt(disc)) / (2 * a)
    if (t < 0) {
      return null
    }

    return {
      ray,
      point: ray.getPoint(t),
      hittable: this,
      distance: t,
    }
  }

  scale(L: number) {
    this.center = this.center.scale(2 / L)
    this.center = this.center.sub(new Vec3(1, 1, 1))
    this.center.x = -this.center.x
    this.center.y = -this.center.y
    this.radius = (this.radius * 2) / L
  }
}
