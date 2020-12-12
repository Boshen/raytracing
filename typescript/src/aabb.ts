import { Hittable } from './model'
import { Ray } from './ray'

export class AABB {
  min: [number, number, number]
  max: [number, number, number]

  constructor(hittables: Hittable[]) {
    const mins = hittables.map((h) => h.getMinPoint())
    const maxs = hittables.map((h) => h.getMaxPoint())
    this.min = [
      Math.min(...mins.map((v) => v.x)),
      Math.min(...mins.map((v) => v.y)),
      Math.min(...mins.map((v) => v.z)),
    ]
    this.max = [
      Math.max(...maxs.map((v) => v.x)),
      Math.max(...maxs.map((v) => v.y)),
      Math.max(...maxs.map((v) => v.z)),
    ]
  }

  // https://tavianator.com/2015/ray_box_nan.html
  intersects(ray: Ray) {
    const origin = [ray.start.x, ray.start.y, ray.start.z]
    const invDir = [ray.inverseDirection.x, ray.inverseDirection.y, ray.inverseDirection.z]

    let t1 = (this.min[0] - origin[0]) * invDir[0];
    let t2 = (this.max[0] - origin[0]) * invDir[0];

    let tmin = Math.min(t1, t2);
    let tmax = Math.max(t1, t2);

    for (let i = 1; i < 3; i++) {
      t1 = (this.min[i] - origin[i]) * invDir[i]
      t2 = (this.max[i] - origin[i]) * invDir[i]
      tmin = Math.max(tmin, Math.min(t1, t2));
      tmax = Math.min(tmax, Math.max(t1, t2));
    }

    return tmax >= Math.max(tmin, 0);
  }
}
