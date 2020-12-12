import { Vec3, Color } from './vec3'
import { Ray, HitRay, HitModel } from './ray'
import { models } from './models'
import { Canvas } from './canvas'
import { Light, AmbientLight, DirectionalLight, PointLight } from './light'
import { stats } from './stats'

export class RayTracing {
  camera = new Vec3(0, 0, -3)
  viewDistance = 500
  width = 500
  height = 500
  focalLength = this.width
  canvas: Canvas
  background = new Vec3(0, 0, 0)
  useAntialias = false
  lights: Light[] = [
    new AmbientLight(1, new Vec3(0.2, 0.2, 0.2)),
    new DirectionalLight(1, new Vec3(1, 1, 1), new Vec3(0, 0, -1)),
    new PointLight(3, new Vec3(1, 1, 1), new Vec3(0, -1, 0)),
  ]

  constructor({ useAntialias }: { useAntialias: boolean }) {
    this.useAntialias = useAntialias
    this.canvas = new Canvas(this.width, this.height)
    this.algorithm()
    this.canvas.render()
  }

  algorithm() {
    const startTime = new Date()
    const toRGB = (c: number) => Math.max(0, Math.round(Math.min(255, c * 255)))
    Array.from({ length: this.width }).forEach((_, i) => {
      Array.from({ length: this.height }).forEach((_, j) => {
        const x = i - this.width / 2
        const y = j - this.height / 2
        const color = this.useAntialias ? this.antialias(x, y) : this.getColor(x, y)
        this.canvas.addPixel(i, j, new Vec3(toRGB(color.x), toRGB(color.y), toRGB(color.z)))
      })
    })
    stats.duration = (+new Date() - +startTime) / 1000
  }

  antialias(x: number, y: number) {
    const n = 5 // sample points
    let color = new Vec3(0, 0, 0)
    Array.from({ length: n }).forEach((_, i) => {
      Array.from({ length: n }).forEach((_, j) => {
        const dx = (i + 0.5) / n
        const dy = (j + 0.5) / n
        color = color.add(this.getColor(x + dx, y + dy))
      })
    })
    return color.scale(1 / (n * n))
  }

  getColor(x: number, y: number) {
    const d = new Vec3(x, y, this.focalLength).unit()
    const ray = new Ray(this.camera, d)
    return this.trace(ray, 0, this.background)
  }

  trace(ray: Ray, depth: number, color: Color): Color {
    let minDistance = Infinity
    let hitModel: HitModel | null = null

    models.forEach((m) => {
      if (m.aabb.intersects(ray)) {
        m.hittables.forEach((h) => {
          const hit = h.intersects(ray)
          if (hit && hit.distance < minDistance) {
            minDistance = hit.distance
            hitModel = { ...hit, model: m }
          }
        })
      }
    })

    if (!hitModel) {
      return this.background
    }

    const shadeColor = this.lights.map((l) => l.shade(hitModel!)).reduce((a, b) => a.add(b), this.background)

    const reflectionColor = this.calcReflectionColor(hitModel, ray, depth, color)
    return shadeColor.add(reflectionColor)
  }

  calcReflectionColor({ model, hittable, point }: HitModel, ray: Ray, depth: number, color: Color) {
    if (depth > 3) {
      return color
    }
    const reflection = model.material.reflection
    if (reflection === 0) {
      return color
    }
    const normal = hittable.normal(point)
    const reflectDir = 2 * ray.direction.dot(normal)
    const reflectRay = new Ray(point, ray.direction.sub(normal.scale(reflectDir)))
    const reflectionColor = this.trace(reflectRay, depth + 1, color)
    return reflectionColor.scale(reflection).add(color)
  }
}
