import { Color } from './vec3'

export interface Material {
  diffuseReflection: number
  diffuseColor: Color
  reflection: number
  specularRefection: number
  shininess: number
  transparent: boolean
}
