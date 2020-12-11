export class Vec3 {
  constructor(public x: number, public y: number, public z: number) {}

  length(): number {
    return Math.sqrt(this.dot(this))
  }

  dot(v: Vec3) {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }

  add(v: Vec3): Vec3 {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z)
  }

  translate(n: number): Vec3 {
    return new Vec3(this.x + n, this.y + n, this.z + n)
  }

  sub(v: Vec3): Vec3 {
    return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z)
  }

  scale(p: number): Vec3 {
    return new Vec3(p * this.x, p * this.y, p * this.z)
  }

  mul(p: Vec3): Vec3 {
    return new Vec3(p.x * this.x, p.y * this.y, p.z * this.z)
  }

  cross(v: Vec3): Vec3 {
    return new Vec3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x)
  }

  unit() {
    return this.scale(1 / this.length())
  }

  distance(v: Vec3) {
    const x = v.x - this.x
    const y = v.y - this.y
    const z = v.z - this.z
    return Math.sqrt(x * x + y * y + z * z)
  }
}

export type Color = Vec3
