import { Color, Vec3 } from './vec3'
import { Ray, HitModel } from './ray'
import { models } from './models'

export abstract class Light {
  abstract radiance: number
  abstract color: Color
  abstract location: Vec3
  abstract shade(hitRay: HitModel): Color
}

export class AmbientLight extends Light {
  location: Vec3 = new Vec3(0, 0, 0)

  constructor(public radiance: number, public color: Color) {
    super()
  }

  shade({ model }: HitModel) {
    const kd = model.material.diffuseReflection
    const cd = model.material.diffuseColor
    const cl = this.color
    const ls = this.radiance
    return cd.scale(kd).mul(cl.scale(ls))
  }
}

export class DirectionalLight extends Light {
  constructor(public radiance: number, public color: Color, public location: Vec3) {
    super()
  }

  shade({ model, hittable, point }: HitModel) {
    const l = this.location.sub(point).unit()
    const kd = model.material.diffuseReflection
    const cd = model.material.diffuseColor
    const n = hittable.normal(point)
    const cl = this.color
    const ls = this.radiance
    return cd
      .scale(kd)
      .scale(1 / 3.14)
      .scale(Math.max(0, n.dot(l)))
      .mul(cl.scale(ls))
  }
}

export class PointLight extends Light {
  constructor(public radiance: number, public color: Color, public location: Vec3) {
    super()
  }

  shade(hitModel: HitModel) {
    const { model, hittable, point, ray } = hitModel
    const w = ray.start.sub(point).unit()
    const l = this.location.sub(point).unit()
    const kd = model.material.diffuseReflection
    const cd = model.material.diffuseColor
    const ks = model.material.specularRefection
    const e = model.material.shininess
    const n = hittable.normal(point)
    const cl = this.color
    const ls = this.radiance

    if (n.dot(w) > 0 && this.isInShadow(l, hitModel)) {
      return new Vec3(0, 0, 0)
    }

    // diffuse
    const diffuseAmount = Math.max(0, n.dot(l))
    const diffuse = cd
      .scale(kd)
      .scale(1 / 3.14)
      .scale(diffuseAmount)
      .mul(cl.scale(ls))

    // specular
    const r = n.scale(2 * diffuseAmount).sub(l)
    const specularAmount = r.dot(w)
    const specular = cl.scale(ks * Math.pow(specularAmount, e) * diffuseAmount * ls)
    return diffuse.add(specular)
  }

  isInShadow(l: Vec3, { hittable, point }: HitModel) {
    const shadowRay = new Ray(point.add(l.scale(0.00001)), l)
    for (let m of models) {
      if (!m.material.transparent) {
        for (let h of m.hittables) {
          if (h != hittable && h.intersects(shadowRay)) {
            return true
          }
        }
      }
    }
    return false
  }
}
