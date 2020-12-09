class Vec3 {
  constructor(
    public x: number,
    public y: number,
    public z: number
  ) { }

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
    return new Vec3(
      (this.y * v.z) - (this.z * v.y),
      (this.z * v.x) - (this.x * v.z),
      (this.x * v.y) - (this.y * v.x)
    )
  }

  unit() {
    return this.scale(1 / this.length())
  }
}

type Color = Vec3

type Mat3 = [number, number, number, number, number, number, number,number, number]

class Matrix {
  constructor(public values: Mat3) {
  }

  inverse(): Matrix | null {
    const [a00, a01, a02, a10, a11, a12, a20, a21, a22] = this.values

    const det01 = a22 * a11 - a12 * a21
    const det11 = -a22 * a10 + a12 * a20
    const det21 = a21 * a10 - a11 * a20

    let det = a00 * det01 + a01 * det11 + a02 * det21

    if (!det) {
      return null
    }

    det = 1.0 / det

    const values: Mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0]
    values[0] = det01 * det
    values[1] = (-a22 * a01 + a02 * a21) * det
    values[2] = (a12 * a01 - a02 * a11) * det
    values[3] = det11 * det
    values[4] = (a22 * a00 - a02 * a20) * det
    values[5] = (-a12 * a00 + a02 * a10) * det
    values[6] = det21 * det
    values[7] = (-a21 * a00 + a01 * a20) * det
    values[8] = (a11 * a00 - a01 * a10) * det
    return new Matrix(values)
  }

  multiplyVec3(vector: Vec3): Vec3 {
    const x = vector.x
    const y = vector.y
    const z = vector.z
    return new Vec3(
      x * this.values[0] + y * this.values[3] + z * this.values[6],
      x * this.values[1] + y * this.values[4] + z * this.values[7],
      x * this.values[2] + y * this.values[5] + z * this.values[8],
    )
  }

}

interface HitRay {
  ray: Ray
  point: Vec3
  // normal: Vec3
  distance: number
}

class Ray {
  constructor(
    public start: Vec3,
    public direction: Vec3
  ) { }

  getPoint(distance: number): Vec3 {
    return this.start.add(this.direction.scale(distance))
  }
}

class Triangle {
  constructor(
    public v0: Vec3,
    public v1: Vec3,
    public v2: Vec3,
    // public normal: Vec3,
    public color: Color,
  ) {
  }

  sign(p1: Vec3, p2: Vec3, p3: Vec3){
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  }


  public intersects(ray: Ray): HitRay | null {
    const EPSILON = 0.000001;
    const e1 = this.v1.sub(this.v0)
    const e2 = this.v2.sub(this.v0)

    const P = ray.direction.cross(e2)
    const det = e1.dot(P);
    if (det > -EPSILON && det < EPSILON) {
      return null
    }

    const inv_det = 1 / det;
    const T = ray.start.sub(this.v0);
    const u = T.dot(P) * inv_det;
    if (u < 0 || u > 1) {
      return null
    }

    const Q = T.cross(e1);
    const v = ray.direction.dot(Q) * inv_det;

    if (v < 0 || u + v  > 1) {
      return null
    }

    const t = e2.dot(Q) * inv_det;

    if (t > EPSILON) {
      return {
        ray,
        point: ray.getPoint(t),
        distance: t
      }
    }

    return null;
  }
}

class Canvas {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private imageData: number[] = []

  constructor(public width: number, public height: number) {
    this.canvas = <HTMLCanvasElement> document.createElement('canvas')
    this.canvas.width  = this.width
    this.canvas.height = this.height
    this.ctx = this.canvas.getContext('2d')!
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        this.addPixel(i, j, new Vec3(0, 0, 0))
      }
    }
    document.body.appendChild(this.canvas)
  }

  public addPixel(i: number, j: number, color: Color) {
    const r = Math.round(color.x)
    const g = Math.round(color.y)
    const b = Math.round(color.z)
    const index = (j * this.width + i) * 4
    this.imageData[index + 0] = r
    this.imageData[index + 1] = g
    this.imageData[index + 2] = b
    this.imageData[index + 3] = 255
  }

  public render() {
    const imageData = new ImageData(new Uint8ClampedArray(this.imageData), this.width, this.height)
    this.ctx.putImageData(imageData, 0, 0)
  }
}

  const lookat = new Vec3(0, 0, 0)
const camera = new Vec3(0, 0, -3)
const width = 500
const height = 500
const focalLength = width
  const ww = camera.sub(lookat).unit()
  const vv = new Vec3(0, 1, 0)
  const uu = vv.cross(ww).unit()

const L = 555
const z_front = -L

const red = new Vec3(255, 0, 0)
const white = new Vec3(255, 255, 255)

const A = new Vec3(L, 0, z_front)
const B = new Vec3(0, 0, z_front)
const C = new Vec3(L,0,L)
const D = new Vec3(0,0,L)
const E = new Vec3(L, L - 1, z_front)
const F = new Vec3(0, L - 1, z_front)
const G = new Vec3(L, L - 1, L)
const H = new Vec3(0, L - 1, L)

const floor = [
  new Triangle(C, B, A, red),
  new Triangle(C, D, B, red)
]

const backwall = [
  new Triangle(G, D, C, white),
  new Triangle(G, H, D, white),
  new Triangle(F, E, A, white),
  new Triangle(F, A, B, white),
]

const triangles = floor.concat(backwall)

const canvas = new Canvas(width, height)

for (let x = 0; x < width; x++) {
  for (let y = 0; y < height; y++) {
    // const d = new Vec3(x - width / 2, y - height / 2, focalLength).unit()
    const d = uu.scale(x).add(vv.scale(y)).sub(ww.scale(focalLength)).unit()
    const ray = new Ray(camera, d)

    let minDistance = Infinity
    let hitItem: Triangle = null
    for (let item of floor) {
      const hit = item.intersects(ray)
      if (hit && hit.distance < minDistance) {
        minDistance = hit.distance
        hitItem = item
      }
    }
    if (hitItem) {
      canvas.addPixel(x, y, hitItem.color)
    }

  }
}

canvas.render()
