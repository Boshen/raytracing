import { Vec3 } from './vec3'
import { Ray } from './ray'
import { triangles } from './models'
import { Canvas } from './canvas'
import { Triangle } from './triangle'

export class RayTracing {
  camera = new Vec3(0, 0, -3)
  viewDistance = 500
  width = 500
  height = 500
  focalLength = this.width
  canvas: Canvas

  constructor() {
    this.canvas = new Canvas(this.width, this.height)
    this.algorithm()
    this.canvas.render()
  }

  algorithm() {
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        const x = i - this.width / 2
        const y = j - this.height / 2
        const d = new Vec3(x, y, this.focalLength).unit()
        const ray = new Ray(this.camera, d)

        let minDistance = Infinity
        let hitItem: Triangle | null = null
        for (let item of triangles) {
          const int = item.intersects(ray)
          if (int && int.distance < minDistance) {
            minDistance = int.distance
            hitItem = item
          }
        }
        if (hitItem) {
          this.canvas.addPixel(i, j, hitItem.color.scale(255))
        }
      }
    }
  }
}
