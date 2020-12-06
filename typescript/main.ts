class V3 {
  constructor(
    public x: number,
    public y: number,
    public z: number
  ) { }

  length(): number {
    return Math.sqrt(this.dot(this))
  }

  dot(v: V3) {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }

  add(v: V3): V3 {
    return new V3(this.x + v.x, this.y + v.y, this.z + v.z)
  }

  translate(n: number): V3 {
    return new V3(this.x + n, this.y + n, this.z + n)
  }

  sub(v: V3): V3 {
    return new V3(this.x - v.x, this.y - v.y, this.z - v.z)
  }

  scale(p: number): V3 {
    return new V3(p * this.x, p * this.y, p * this.z)
  }

  mul(p: V3): V3 {
    return new V3(p.x * this.x, p.y * this.y, p.z * this.z)
  }

  cross(v: V3): V3 {
    return new V3(
      (this.y * v.z) - (this.z * v.y),
      (this.z * v.x) - (this.x * v.z),
      (this.x * v.y) - (this.y * v.x)
    )
  }

  unit() {
    return this.scale(1 / this.length())
  }
}

type Color = V3

class Line {
  constructor(
    public origin: V3,
    public line: V3
  ) { }

  getPoint(distance: number): V3 {
    return this.origin.add(this.line.scale(distance))
  }
}

interface AmbientLight {
  type: 'ambient'
  radiance: number
  color: Color
}

interface DirectionalLight {
  type: 'directional'
  radiance: number
  color: Color
  location: V3
}

interface PointLight {
  type: 'point'
  radiance: number
  color: Color
  location: V3
}

type Light = AmbientLight | DirectionalLight | PointLight

interface RayHit {
  ray: Line
  point: V3
  normal: V3
  distance: number
}

interface Scene {
  items: Item[]
  lights: Light[]
  background: Color
}

interface Material {
  diffuseReflection: number
  diffuseColor: V3
  reflection: number
  specularRefection: number
  shininess: number
}

abstract class Item {
  constructor(
    public material: Material
  ) {}
  abstract intersects(ray: Line): RayHit | null

  solveq(a: number, b: number, c: number): number[] {
    const d = b * b - 4 * a * c
    if (d < 0) {
      return []
    } else if (d > 0) {
      return [(-b - Math.sqrt(d)) / (2 * a), (-b + Math.sqrt(d)) / (2 * a)]
    } else {
      return [-b / (2 * a)]
    }
  }
}

class Sphere extends Item {
  constructor(
    public radius: number,
    public center: V3,
    public material: Material
  ) {
    super(material)
  }

  public normal(p: V3): V3 {
    return p.sub(this.center)
  }

  public intersects(ray: Line) {
    const d = ray.origin.sub(this.center)
    const roots = this.solveq(ray.line.dot(ray.line), 2 * ray.line.dot(d), d.dot(d) - this.radius * this.radius)
    .filter((x) => x > Math.pow(10, -6))
    if (roots.length === 0) {
      return null
    } else {
      const distance = Math.min(...roots)
      const point = ray.getPoint(distance)
      const normal = point.sub(this.center).unit()
      return {
        ray,
        point,
        normal,
        distance
      }
    }
  }
}

class Plane extends Item {
  constructor(
    public position: V3,
    public planeNormal: V3,
    public material: Material
  ) {
    super(material)
  }

  intersects(ray: Line) {
    const distance = this.position.sub(ray.origin).dot(this.planeNormal) / ray.line.dot(this.planeNormal)
    return distance <= 0 ? null : {
      ray,
      point: ray.getPoint(distance),
      normal: this.planeNormal,
      distance
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
    this.canvas.width  = this.width
    this.canvas.height = this.height
    let imageData = new ImageData(new Uint8ClampedArray(this.imageData), this.width, this.height)
    this.ctx.putImageData(imageData, 0, 0)
  }
}

const calcShade = (scene: Scene, item: Item, hitRay: RayHit, light: Light): Color => {
  const kd = item.material.diffuseReflection
  const cd = item.material.diffuseColor
  const ks = item.material.specularRefection
  const e = item.material.shininess
  const n = hitRay.normal
  const cl = light.color
  const ls = light.radiance
  const s = hitRay.ray.origin
  const p = hitRay.point

  switch (light.type) {
    case 'ambient': {
      return cd.scale(kd).mul(cl.scale(ls))
    }
    case 'directional': {
      const l = light.location.sub(p).unit()
      return cd.scale(kd).scale(1 / 3.14).scale(Math.max(0, n.dot(l))).mul(cl.scale(ls))
    }
    case 'point': {
      const w = s.sub(p).unit()
      const l = light.location.sub(p).unit()

      const shadowRay = new Line(p.add(l.scale(0.001)), l)
      const inShadow = n.dot(w) > 0 &&
        scene.items.filter((s) => s != item).some((s) => !!s.intersects(shadowRay))

      if (inShadow) {
        return new V3(0, 0, 0)
      }

      const diffuseAmount = Math.max(0, n.dot(l))
      const diffuse = cd.scale(kd).scale(1 / 3.14)
      .scale(diffuseAmount).mul(cl.scale(ls))

      const r = n.scale(2 * diffuseAmount).sub(l)
      const specularAmount = r.dot(w)
      const specular = cl.scale(ks * Math.pow(specularAmount, e) * diffuseAmount * ls)
      return diffuse.add(specular)
    }
  }
}

const calcReflection = (scene: Scene, item: Item, ray: Line, rayHit: RayHit, depth: number, color: Color) => {
  if (depth > 3) {
    return color
  }
  const reflection = item.material.reflection
  if (reflection === 0) {
    return color
  }
  const reflectDir = 2 * ray.line.dot(rayHit.normal)
  const reflectRay = new Line(
    rayHit.point,
    ray.line.sub(rayHit.normal.scale(reflectDir))
  )
  const reflectionColor = trace(scene, reflectRay, depth + 1, color)
  return reflectionColor.scale(reflection).add(color)
}

const trace = (scene: Scene, ray: Line, depth: number, color: Color): Color => {
  const hits = scene.items.map((item) => {
    const hitRay = item.intersects(ray)
    return hitRay && { hitRay, item}
  })
  .filter(Boolean)

  if (hits.length === 0) {
    return new V3(0, 0, 0)
  }

  let hit = hits[0]
  hits.slice(1).forEach((h) => {
    if (h.hitRay.distance < hit.hitRay.distance) {
      hit = h
    }
  })

  const shadeColor = scene.lights
  .map((l) => calcShade(scene, hit.item, hit.hitRay, l))
  .reduce((a, b) => a.add(b), new V3(0, 0, 0))

  const reflectionColor = calcReflection(scene, hit.item, ray, hit.hitRay, depth, color)

  return shadeColor.add(reflectionColor)
}

const main = () => {
  const width = 500
  const height = 500

  const lookat = new V3(0, 0, -50)
  const eye = new V3(0, -100, 500)
  const ww = eye.sub(lookat).unit()
  const vv = new V3(0, 1, 0)
  const uu = vv.cross(ww).unit()
  const viewDistance = 400

  const lights: Light[] = [
    {type:'ambient', radiance: 0.1, color: new V3(0.05, 0.05, 0.05)},
    {type:'directional', radiance: 1, color: new V3(1, 1, 1), location: new V3(1, -1, 0)},
    {type:'point', radiance: 3, color: new V3(1, 1, 1), location: new V3(1000, -5000, 0)},
  ]

  const items: Item[] = []
  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      const material = {
        diffuseReflection: 0.8,
        diffuseColor: new V3(Math.max(0, i), Math.max(0, j), Math.max(0, i * j)),
        reflection: 0.2,
        specularRefection: 0.2,
        shininess: 20
      }
      items.push(
        new Sphere(
          50,
          new V3(150 * i, 50, 200 * j),
          material
        ),
      )
    }
  }

  items.push(
    new Plane(
      new V3(0, 100, 0),
      new V3(0, -1, 0),
      {
        diffuseReflection: 0.5,
        diffuseColor: new V3(0.5, 0.5, 0.5),
        reflection: 0.5,
        specularRefection: 0,
        shininess: 0
      }
    )
  )

  const canvas = new Canvas(width, height)

  const scene: Scene = {
    items,
    lights,
    background: new V3(0, 0, 0),
  }

  const samplePoints = 5
  const toRGB = (n: number) => Math.max(0, Math.round(Math.min(255, n / (samplePoints * samplePoints) * 255)))

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      let color = new V3(0, 0, 0)

      for (let x = 0; x < samplePoints; x++) {
        for (let y = 0; y < samplePoints; y++) {
          const dx = (x + 0.5) / samplePoints
          const dy = (y + 0.5) / samplePoints
          const fx = i - width / 2 + dx
          const fy = j - height / 2 + dy
          const d = uu.scale(fx).add(vv.scale(fy)).sub(ww.scale(viewDistance)).unit()
          const ray = new Line(eye, d)
          color = color.add(trace(scene, ray, 0, scene.background))
        }
      }

      canvas.addPixel(i, j, new V3(toRGB(color.x), toRGB(color.y), toRGB(color.z)))
    }
  }

  canvas.render()
}

main()
