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

  public mul(p: Vector): Vector {
    return new Vector(
      p.x * this.x,
      p.y * this.y,
      p.z * this.z
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
    public radiance: number,
    public lightColor: Vector,
    public lightLocation: Vector,
  ) { }
}

class Sphere {
  constructor(
    public radius: number,
    public center: Vector,
    public color: Vector,
    public diffuseReflection: number ,
    public diffuseColor: Vector,
    public reflection: number,
    public specularRefection: number,
    public shininess: number
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
    new Light(3, new Vector(1, 1, 1), new Vector(1000, -5000, 0)),
  ]

  const background = new Vector(0, 0, 0)

  const spheres = []
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      spheres.push(
        new Sphere(
          50,
          new Vector(150 * i, 50, 200 * j),
          new Vector(255, 0, 0),
          0.8,
          new Vector(Math.max(0, i), Math.max(0, j), Math.max(0, i * j)),
          0.2,
          0.2,
          20
        ),
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

    if (!object) {
      return null
    }
    const point = ray.getPoint(minD)
    return lights.map((l) => calcShade(ray, point, object, l)).reduce((a, b) => a.add(b))
  }

  function calcShade(ray: Line, point: Vector, object: Sphere, light: Light): Vector {
    const hitNormal = object.normal(point).unit()
    const viewDirection = ray.origin.sub(point).unit()
    const shadowDirection = light.lightLocation.sub(point).unit()
    const shadowRay = new Line(point.add(shadowDirection.scale(0.001)), shadowDirection)

    const inShadow = hitNormal.dot(viewDirection) > 0 && spheres.some((s) => s.intersection(shadowRay) < Infinity)
    if (inShadow) {
      return new Vector(0, 0, 0)
    }

    const diffuseAmount = Math.max(0, hitNormal.dot(shadowDirection))
    const diffuse = object.diffuseColor.scale(object.diffuseReflection).scale(1 / 3.14).scale(diffuseAmount).mul(light.lightColor.scale(light.radiance))
    return diffuse
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
      const toRGB = (n: number) => Math.min(255, Math.round(n * 255))
      canvas.addPixel(i, j, new Vector(toRGB(color.x), toRGB(color.y), toRGB(color.z)))
    }
  }

  canvas.render()
}

main()
