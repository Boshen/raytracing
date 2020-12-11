import { Color, Vec3 } from './vec3'

interface AmbientLight {
  type: 'ambient'
  radiance: number
  color: Color
}

interface DirectionalLight {
  type: 'directional'
  radiance: number
  color: Color
  location: Vec3
}

interface PointLight {
  type: 'point'
  radiance: number
  color: Color
  location: Vec3
}

export type Light = AmbientLight | DirectionalLight | PointLight
