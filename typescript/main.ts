class Vector {
  constructor(
    public x: number,
    public y: number,
    public z: number
  ) { }

  public length(): number {
    return Math.sqrt(this.dot(this))
  }

  public dot(v: Vector) {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }

  public add(v: Vector): Vector {
    return new Vector(
      this.x + v.x,
      this.y + v.y,
      this.z + v.z
    )
  }

  public translate(n: number): Vector {
    return new Vector(
      this.x + n,
      this.y + n,
      this.z + n
    )
  }

  public sub(v: Vector): Vector {
    return new Vector(
      this.x - v.x,
      this.y - v.y,
      this.z - v.z
    )
  }

  public scale(p: number): Vector {
    return new Vector(
      p * this.x,
      p * this.y,
      p * this.z
    )
  }

  public cross(v: Vector): Vector {
    return new Vector(
      (this.y * v.z) - (this.z * v.y),
      (this.z * v.x) - (this.x * v.z),
      (this.x * v.y) - (this.y * v.x)
    )
  }

  public unit() {
    return this.scale(1 / this.length())
  }

  public toString() {
    return `[${this.x}, ${this.y}, ${this.z}]`
  }
}

class Line {
  constructor(
    public origin: Vector,
    public line: Vector
  ) { }

  public getPoint(distance: number): Vector {
    return this.origin.add(this.line.scale(distance))
  }

  public toString() {
    return `origin: ${this.origin}, line: ${this.line}`
  }
}

class Light {
  constructor(
    public source: Vector,
    public illumination: number
  ) { }
}

class Sphere {
  constructor(
    public radius: number,
    public center: Vector,
    public color: Vector,
    public lambert: number = 0.7,
    public ambient: number = 0.1,
    public specular: number = 0.2
  ) { }

  public normal(p: Vector): Vector {
    return p.sub(this.center)
  }

  public intersection(ray: Line): number {
    // (-b +- sqrt(b^2 - a*c)) / a
    const originToCenter = ray.origin.sub(this.center)
    // const a = ray.line.dot(ray.line) === 1
    const b = ray.line.dot(originToCenter)
    const c = originToCenter.dot(originToCenter)
    const d = Math.pow(b, 2) - c + Math.pow(this.radius, 2) // discriminant

    if (d <= 0) {
      return Infinity
    } else {
      const sqrtD = Math.sqrt(d)
      const root1 = -b + sqrtD
      const root2 = -b - sqrtD
      return Math.min.apply(null, [root1, root2].filter((x) => x >= 0))
    }
  }
}

class Canvas {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private imageData: number[] = []

  constructor(public width: number, public height: number) {
    this.canvas = <HTMLCanvasElement> document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    document.body.appendChild(this.canvas)
  }

  public addPixel(i: number, j: number, color: Vector) {
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
    this.canvas.width  = this.width
    this.canvas.height = this.height
    let imageData = new ImageData(new Uint8ClampedArray(this.imageData), this.width, this.height)
    this.ctx.putImageData(imageData, 0, 0)
  }
}

const main = () => {
  const width = 500
  const height = 500

  const lookat = new Vector(0, 0, -50)
  const eye = new Vector(0, -100, 500)
  const ww = eye.sub(lookat).unit()
  const vv = new Vector(0, 1, 0)
  const uu = vv.cross(ww).unit()
  const viewDistance = 400

  const lights = [
    new Light(new Vector(1000, -5000, 0), 3),
  ]

  const background = new Vector(0, 0, 0)

  const spheres = []
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      spheres.push(
    new Sphere(50, new Vector(150 * i, 50, 200 * j), new Vector(255, 0, 0)),
      )
    }
  }

  function trace(ray: Line, depth: number, object?: Sphere): Vector | null {
    if (depth > 3) {
      return new Vector(0, 0, 0)
    }

    // trace ray from eye to objects
    let minD = Infinity
    spheres.forEach((sphere) => {
      const d = sphere.intersection(ray)
      if (d < minD) {
        minD = d
        object = sphere
      }
    })

    // no object has been found
    if (minD === Infinity) {
      return null
    }

    const point = ray.getPoint(minD)
    return object && hit(ray, point, object, depth)
  }

  function hit(ray: Line, point: Vector, object: Sphere, depth: number): Vector {
    const normal = object.normal(point).unit()

    let lambert = 0
    for (let light of lights) {
      // compute shadow
      // trace ray from intersection point to light source
      // add an offset so shadow ray will not intersect with the origin object itself
      let minD = Infinity
      const shadowDirection = light.source.sub(point).unit()
      const shadowRay = new Line(point.add(shadowDirection.scale(0.001)), shadowDirection)
      for (let sphere of spheres) {
        const d = sphere.intersection(shadowRay)
        if (d < minD) {
          minD = d
          break
        }
      }
      if (minD !== Infinity) {
        continue
      }

      // compute lambertian shading
      const l = light.source.sub(point).unit()
      lambert += Math.max(0, normal.dot(l))
    }

    // compute specular shading
    const r = ray.line.sub(normal.scale(2).scale(normal.dot(ray.line)))
    const color = trace(new Line(point.add(r.scale(0.001)), r), depth + 1)
    const c = color ? color.scale(object.specular) : new Vector(0, 0, 0)

    return c
    .add(object.color.scale(Math.min(1, lambert) * object.lambert))
    .add(object.color.scale(object.ambient))
  }

  const canvas = new Canvas(width, height)

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      // transformed pixel position
      const x = i - width / 2
      const y = j - height / 2
      // eye -> line direction vector
      const d = uu.scale(x).add(vv.scale(y)).sub(ww.scale(viewDistance)).unit()
      const ray = new Line(eye, d)
      const color = trace(ray, 0) || background
      canvas.addPixel(i, j, color)
    }
  }

  canvas.render()
}

main()
