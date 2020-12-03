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
  ) { }
}

class AmbientLight extends Light {
}

class DirectionalLight extends Light {
  constructor(
    public radiance: number,
    public lightColor: Vector,
    public lightLocation: Vector,
  ) {
    super(radiance, lightColor)
  }
}

class PointLight extends Light {
  constructor(
    public radiance: number,
    public lightColor: Vector,
    public lightLocation: Vector,
  ) {
    super(radiance, lightColor)
  }
}

class RayHit {
  constructor(
    public hitRay: Line,
    public hitPoint: Vector,
    public hitNormmal: Vector,
    public hitDistance: number
  ) { }
}

const solveq = (a, b, c) => {
  const d = b * b - 4 * a * c
  if (d < 0) {
    return []
  } else if (d > 0) {
    return [(-b - Math.sqrt(d)) / (2 * a), (-b + Math.sqrt(d)) / (2 * a)]
  } else {
    return [-b / (2 * a)]
  }
}

class Sphere {
  constructor(
    public radius: number,
    public center: Vector,
    public diffuseReflection: number ,
    public diffuseColor: Vector,
    public reflection: number,
    public specularRefection: number,
    public shininess: number
  ) { }

  public normal(p: Vector): Vector {
    return p.sub(this.center)
  }

  public intersects(ray: Line) {
    const d = ray.origin.sub(this.center)
    const roots = solveq(ray.line.dot(ray.line), 2 * ray.line.dot(d), d.dot(d) - this.radius * this.radius)
    .filter((x) => x > Math.pow(10, -6))
    if (roots.length === 0) {
      return null
    } else {
      const hitDistance = Math.min(...roots)
      const hitPoint = ray.origin.add(ray.line.scale(hitDistance))
      const hitNormal = hitPoint.sub(this.center).unit()
      return new RayHit(ray, hitPoint, hitNormal, hitDistance)
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
    new AmbientLight(0.1, new Vector(0.05, 0.05, 0.05)),
    new DirectionalLight(1, new Vector(1, 1, 1), new Vector(1, -1, 0)),
    new PointLight(3, new Vector(1, 1, 1), new Vector(1000, -5000, 0)),
  ]

  const background = new Vector(0, 0, 0)

  const spheres: Sphere[] = []
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      spheres.push(
        new Sphere(
          50,
          new Vector(150 * i, 50, 200 * j),
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

    const hits = spheres.map((object) => {
      const hitRay = object.intersects(ray)
      return hitRay && { hitRay, object}
    })
      .filter(Boolean)

    if (hits.length === 0) {
      return null
    }

    let hit = hits[0]
    hits.slice(1).forEach((h) => {
      if (h.hitRay.hitDistance < hit.hitRay.hitDistance) {
        hit = h
      }
    })

    return lights
      .map((l) => calcShade(hit.object, hit.hitRay, l))
      .reduce((a, b) => a.add(b), new Vector(0, 0, 0))
  }

  function calcShade(object: Sphere, hitRay: RayHit, light: Light): Vector {
    const kd = object.diffuseReflection
    const cd = object.diffuseColor
    const n = hitRay.hitNormmal
    const cl = light.lightColor
    const ls = light.radiance
    const s = hitRay.hitRay.origin
    const p = hitRay.hitPoint

    if (light instanceof AmbientLight) {
      return cd.scale(kd).mul(light.lightColor.scale(light.radiance))
    }

    if (light instanceof DirectionalLight) {
      const l = light.lightLocation.sub(p).unit()
      return cd.scale(kd).scale(1 / 3.14).scale(Math.max(0, n.dot(l))).mul(cl.scale(ls))
    }

    if (light instanceof PointLight) {
      const w = s.sub(p).unit()
      const l = light.lightLocation.sub(p).unit()

      const shadowRay = new Line(p.add(l.scale(0.001)), l)
      const inShadow = n.dot(w) > 0 &&
        spheres.filter((s) => s != object).some((s) => !!s.intersects(shadowRay))

      if (inShadow) {
        return new Vector(0, 0, 0)
      }

      const diffuseAmount = Math.max(0, n.dot(l))
      const diffuse = cd.scale(kd).scale(1 / 3.14)
      .scale(diffuseAmount).mul(cl.scale(ls))

      const ks = object.specularRefection
      const e = object.shininess
      const r = n.scale(2 * diffuseAmount).sub(l)
      const specularAmount = r.dot(w)
      const specular = cl.scale(ks * Math.pow(specularAmount, e) * diffuseAmount * ls)
      return diffuse.add(specular)
    }
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
      const toRGB = (n: number) => Math.max(0, Math.round(Math.min(255, n * 255)))
      canvas.addPixel(i, j, new Vector(toRGB(color.x), toRGB(color.y), toRGB(color.z)))
    }
  }

  canvas.render()
}

main()
