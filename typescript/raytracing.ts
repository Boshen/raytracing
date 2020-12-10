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

  distance(v: Vec3) {
    const x = v.x - this.x
    const y = v.y - this.y
    const z = v.z - this.z
    return Math.sqrt(x * x + y * y + z * z)
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

  // public intersects(ray: Ray) {
    // const v0 = this.v0;
    // const v1 = this.v1;
    // const v2 = this.v2;
    // const e1 = v1.sub(v0);
    // const e2 = v2.sub(v0);
    // const b = ray.start.sub(v0);
    // const d = ray.direction
    // const A = new Matrix([
      // -d.x, -d.y, -d.z,
      // e1.x, e1.y, e1.z,
      // e2.x, e2.y, e2.z
    // ])
    // const inverse = A.inverse()
    // return inverse && inverse.multiplyVec3(b);
  // }

  // Möller–Trumbore intersection algorithm
  public intersects(ray: Ray): HitRay | null {
    const EPSILON = 0.000001;
    const e1 = this.v1.sub(this.v0)
    const e2 = this.v2.sub(this.v0)

    const h = ray.direction.cross(e2)
    const a = e1.dot(h);
    if (a > -EPSILON && a < EPSILON) {
      return null
    }

    const f = 1 / a;
    const s = ray.start.sub(this.v0);
    const u = f * s.dot(h);
    if (u < 0 || u > 1) {
      return null
    }

    const q = s.cross(e1);
    const v = f * ray.direction.dot(q);

    if (v < 0 || u + v  > 1) {
      return null
    }

    const t = f * e2.dot(q);
    if (t > EPSILON) {
      return {
        ray,
        point: ray.getPoint(t),
        distance: t
      }
    }

    return null;
  }

  scale(L: number) {
    this.v0 = this.v0.scale(2 / L);
    this.v1 = this.v1.scale(2 / L);
    this.v2 = this.v2.scale(2 / L);

    this.v0 = this.v0.sub(new Vec3(1, 1, 1));
    this.v1 = this.v1.sub(new Vec3(1, 1, 1));
    this.v2 = this.v2.sub(new Vec3(1, 1, 1));

    this.v0.x = this.v0.x * -1;
    this.v1.x = this.v1.x * -1;
    this.v2.x = this.v2.x * -1;

    this.v0.y = this.v0.y * -1;
    this.v1.y = this.v1.y * -1;
    this.v2.y = this.v2.y * -1;
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

const camera = new Vec3(0, 0, -3)
const viewDistance = 500
const width = 500
const height = 500
const focalLength = width

const L = 555
const z_front = 0 // -L

const red = new Vec3(0.75, 0.15, 0.15)
const white = new Vec3(0.75, 0.75, 0.75)
const beige = new Vec3(0.85, 0.85, 0.7)
const blue = new Vec3(0.05, 0.6, 1)
const green = new Vec3(0.15, 0.75, 0.15);


const A = new Vec3(L, 0, z_front)
const B = new Vec3(0, 0, z_front)
const C = new Vec3(L, 0, L)
const D = new Vec3(0, 0, L)
const E = new Vec3(L, L, z_front)
const F = new Vec3(0, L, z_front)
const G = new Vec3(L, L, L)
const H = new Vec3(0, L, L)

const triangles = [
  // floor
  new Triangle(C, B, A, beige),
  new Triangle(C, D, B, beige),
  // left
  new Triangle(A, E, C, green),
  new Triangle(C, E, G, green),
  // right
  new Triangle(F, B, D, blue),
  new Triangle(H, F, D, blue),
  // front wall
  new Triangle(G, D, C, beige),
  new Triangle(G, H, D, beige),
  // ceiling
  new Triangle(E, F, G, beige),
  new Triangle(F, H, G, beige),
]

triangles.forEach((o) => o.scale(L))

const canvas = new Canvas(width, height)

for (let i = 0; i < width; i++) {
  for (let j = 0; j < height; j++) {
    const x = i - width / 2
    const y = j - height / 2
    const d = new Vec3(x, y, focalLength).unit()
      // const d = uu.scale(x)
      // .add(vv.scale(y))
      // .sub(ww.scale(viewDistance))
      // .unit()
    const ray = new Ray(camera, d)

    let minDistance = Infinity
    let hitItem: Triangle = null
    for (let item of triangles) {
      const int = item.intersects(ray)
      if (int && int.distance < minDistance) {
        minDistance = int.distance
        hitItem = item
      }
    }
    if (hitItem) {
      canvas.addPixel(i, j, hitItem.color.scale(255))
    }
  }
}

canvas.render()
