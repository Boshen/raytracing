class Vec3 {
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

type Color = Vec3

type Mat3 = [number, number, number, number, number, number, number, number, number]

class Matrix {
  constructor(public values: Mat3) {}

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
      x * this.values[2] + y * this.values[5] + z * this.values[8]
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
  constructor(public start: Vec3, public direction: Vec3) {}

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
    public color: Color
  ) {}

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
  }
}

class Canvas {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private imageData: number[] = []

  constructor(public width: number, public height: number) {
    this.canvas = <HTMLCanvasElement>document.createElement('canvas')
    this.canvas.width = this.width
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
const z_front = -L // closed box for mirror effect

const red = new Vec3(0.75, 0.15, 0.15)
const white = new Vec3(0.75, 0.75, 0.75)
const beige = new Vec3(0.85, 0.85, 0.7)
const blue = new Vec3(0.05, 0.6, 1)
const green = new Vec3(0.15, 0.75, 0.15)
const orange = new Vec3(0.8, 0.7, 0.05)


let A = new Vec3(L, 0, z_front)
let B = new Vec3(0, 0, z_front)
let C = new Vec3(L, 0, L)
let D = new Vec3(0, 0, L)
let E = new Vec3(L, L - 1, z_front)
let F = new Vec3(0, L - 1, z_front)
let G = new Vec3(L, L - 1, L)
let H = new Vec3(0, L - 1, L)

const walls = [
  // floor
  new Triangle(C, B, A, beige),
  new Triangle(C, D, B, beige),
  // left
  new Triangle(A, E, C, red),
  new Triangle(C, E, G, red),
  // right
  new Triangle(F, B, D, green),
  new Triangle(H, F, D, green),
  // front wall
  new Triangle(G, D, C, beige),
  new Triangle(G, H, D, beige),
  // wall behind camera
  new Triangle(F, E, A, beige),
  new Triangle(F, A, B, beige),
]

// ceiling with hole
const holeRadius = 75
let I = new Vec3(L / 2 + holeRadius, L, L / 2 - holeRadius)
let J = new Vec3(L / 2 - holeRadius, L, L / 2 - holeRadius)
let K = new Vec3(L / 2 + holeRadius, L, L / 2 + holeRadius)
let L2 = new Vec3(L / 2 - holeRadius, L, L / 2 + holeRadius)
let M = new Vec3(L / 2 + holeRadius, L, z_front)
let N = new Vec3(L / 2 - holeRadius, L, z_front)
let O = new Vec3(L / 2 + holeRadius, L, L + 5)
let P = new Vec3(L / 2 - holeRadius, L, L + 5)
E = new Vec3(L + 5, L, z_front)
F = new Vec3(-5, L, z_front)
G = new Vec3(L + 5, L, L + 5)
H = new Vec3(-5, L, L + 5)
const ceiling = [
  new Triangle(E, M, G, beige),
  new Triangle(M, O, G, beige),
  new Triangle(M, N, I, beige),
  new Triangle(N, J, I, beige),
  new Triangle(N, F, P, beige),
  new Triangle(F, H, P, beige),
  new Triangle(K, L2, O, beige),
  new Triangle(L2, P, O, beige),
]

// light hole
const lightBoxHeight = 5
M = new Vec3(L / 2 + holeRadius, L - lightBoxHeight, L / 2 - holeRadius)
N = new Vec3(L / 2 - holeRadius, L - lightBoxHeight, L / 2 - holeRadius)
O = new Vec3(L / 2 + holeRadius, L - lightBoxHeight, L / 2 + holeRadius)
P = new Vec3(L / 2 - holeRadius, L - lightBoxHeight, L / 2 + holeRadius)
const hole = [
  new Triangle(I, J, M, beige),
  new Triangle(J, N, M, beige),
  new Triangle(J, L2, N, beige),
  new Triangle(L2, P, N, beige),
  new Triangle(L2, K, O, beige),
  new Triangle(L2, O, P, beige),
  new Triangle(I, M, O, beige),
  new Triangle(K, I, O, beige),
]

// short block
A = new Vec3(290, 0, 114)
B = new Vec3(130, 0, 65)
C = new Vec3(240, 0, 272)
D = new Vec3(82, 0, 225)
E = new Vec3(290, 165, 114)
F = new Vec3(130, 165, 65)
G = new Vec3(240, 165, 272)
H = new Vec3(82, 165, 225)

const shortBlock = [
  new Triangle(E, B, A, blue),
  new Triangle(E, F, B, blue),
  new Triangle(F, D, B, blue),
  new Triangle(F, H, D, blue),
  new Triangle(H, C, D, blue),
  new Triangle(H, G, C, blue),
  new Triangle(G, E, C, blue),
  new Triangle(E, A, C, blue),
  new Triangle(G, F, E, blue),
  new Triangle(G, H, F, blue),
]

A = new Vec3(423, 0, 247)
B = new Vec3(265, 0, 296)
C = new Vec3(472, 0, 406)
D = new Vec3(314, 0, 456)
E = new Vec3(423, 330, 247)
F = new Vec3(265, 330, 296)
G = new Vec3(472, 330, 406)
H = new Vec3(314, 330, 456)

const tallBlock = [
  new Triangle(E, B, A, orange),
  new Triangle(E, F, B, orange),
  new Triangle(F, D, B, orange),
  new Triangle(F, H, D, orange),
  new Triangle(H, C, D, orange),
  new Triangle(H, G, C, orange),
  new Triangle(G, E, C, orange),
  new Triangle(E, A, C, orange),
  new Triangle(G, F, E, orange),
  new Triangle(G, H, F, orange),
]

const triangles = walls.concat(ceiling).concat(hole).concat(shortBlock).concat(tallBlock)

triangles.forEach((o) => o.scale(L))

const canvas = new Canvas(width, height)

for (let i = 0; i < width; i++) {
  for (let j = 0; j < height; j++) {
    const x = i - width / 2
    const y = j - height / 2
    const d = new Vec3(x, y, focalLength).unit()
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
