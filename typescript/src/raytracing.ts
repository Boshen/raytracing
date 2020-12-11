import { Vec3, Color } from './vec3'
import { Ray, HitRay } from './ray'
import { models } from './models'
import { Canvas } from './canvas'
import { Light } from './light'

export class RayTracing {
  camera = new Vec3(0, 0, -3)
  viewDistance = 500
  width = 500
  height = 500
  focalLength = this.width
  canvas: Canvas
  background = new Vec3(0, 0, 0)
  lights: Light[] = [
    { type: 'ambient', radiance: 1, color: new Vec3(0.2, 0.2, 0.2) },
    { type: 'directional', radiance: 1, color: new Vec3(1, 1, 1), location: new Vec3(0, 0, -1) },
    { type: 'point', radiance: 3, color: new Vec3(1, 1, 1), location: new Vec3(0, -1, 0) },
  ]

  constructor() {
    this.canvas = new Canvas(this.width, this.height)
    this.algorithm()
    this.canvas.render()
  }

  algorithm() {
    Array.from({ length: this.width }).forEach((_, i) => {
      Array.from({ length: this.height }).forEach((_, j) => {
        const x = i - this.width / 2
        const y = j - this.height / 2
        const d = new Vec3(x, y, this.focalLength).unit()
        const ray = new Ray(this.camera, d)
        const color = this.trace(ray, 0, this.background)
        this.canvas.addPixel(i, j, color.scale(255))
      })
    })
  }

  trace(ray: Ray, depth: number, color: Color): Color {
    let minDistance = Infinity
    let hitRay: HitRay | null = null

    models.forEach((m) => {
      const hit = m.intersects(ray)
      if (hit && hit.distance < minDistance) {
        minDistance = hit.distance
        hitRay = hit
      }
    })

    if (!hitRay) {
      return this.background
    }

    const shadeColor = this.lights
      .map((l) => this.calcShadeColor(hitRay!, l))
      .reduce((a, b) => a.add(b), this.background)

    const reflectionColor = this.calcReflectionColor(hitRay, ray, depth, color)
    return shadeColor.add(reflectionColor)
  }

  calcShadeColor({ model, point, ray }: HitRay, light: Light) {
    const kd = model.material.diffuseReflection
    const cd = model.material.diffuseColor
    const ks = model.material.specularRefection
    const e = model.material.shininess
    const n = model.normal(point)
    const cl = light.color
    const ls = light.radiance
    const s = ray.start
    const p = point

    switch (light.type) {
      case 'ambient': {
        return cd.scale(kd).mul(cl.scale(ls))
      }
      case 'directional': {
        const l = light.location.sub(p).unit()
        return cd
          .scale(kd)
          .scale(1 / 3.14)
          .scale(Math.max(0, n.dot(l)))
          .mul(cl.scale(ls))
      }
      case 'point': {
        const w = s.sub(p).unit()
        const l = light.location.sub(p).unit()

        // calculate shadow
        const shadowRay = new Ray(p.add(l.scale(0.00001)), l)
        const inShadow = n.dot(w) > 0 && models
          .filter((s) => s != model)
          .filter((s) => !s.material.transparent)
          .some((s) => !!s.intersects(shadowRay))
        if (inShadow) {
          return this.background
        }

        const diffuseAmount = Math.max(0, n.dot(l))
        const diffuse = cd
          .scale(kd)
          .scale(1 / 3.14)
          .scale(diffuseAmount)
          .mul(cl.scale(ls))

        const r = n.scale(2 * diffuseAmount).sub(l)
        const specularAmount = r.dot(w)
        const specular = cl.scale(ks * Math.pow(specularAmount, e) * diffuseAmount * ls)
        return diffuse.add(specular)
      }
    }
  }

   calcReflectionColor({ model, point }: HitRay, ray: Ray, depth: number, color: Color) {
    if (depth > 3) {
      return color
    }
    const reflection = model.material.reflection
    if (reflection === 0) {
      return color
    }
    const normal = model.normal(point)
    const reflectDir = 2 * ray.direction.dot(normal)
    const reflectRay = new Ray(
      point,
      ray.direction.sub(normal.scale(reflectDir))
    )
    const reflectionColor = this.trace(reflectRay, depth + 1, color)
    return reflectionColor.scale(reflection).add(color)
  }
}
