import { Vec3 } from './vec3'
import { Model, Triangle, Sphere } from './model'
import { Material } from './material'

const L = 555
const z_front = -L // closed box for mirror effect

const defaultMetarial: Material = {
  diffuseReflection: 1,
  diffuseColor: new Vec3(0, 0, 0),
  reflection: 0,
  specularRefection: 0,
  shininess: 0,
  transparent: false,
}

const wallBeige = { ...defaultMetarial, diffuseColor: new Vec3(0.85, 0.85, 0.7) }
const wallRed = { ...defaultMetarial, diffuseColor: new Vec3(0.75, 0.15, 0.15) }
const wallGreen = { ...defaultMetarial, diffuseColor: new Vec3(0.15, 0.75, 0.15) }
const lightMaterial = { ...defaultMetarial, diffuseColor: new Vec3(1, 1, 1), diffuseReflection: 10, transparent: true }
const lightBoxMaterial = { ...defaultMetarial, diffuseColor: new Vec3(0.2, 0.2, 0.2), diffuseReflection: 5, transparent: true }
const blockBlue = { ...defaultMetarial, diffuseColor: new Vec3(0.05, 0.6, 1) }
const blockOrange = { ...defaultMetarial, diffuseColor: new Vec3(0.8, 0.7, 0.05) }
const sphereMaterial = { ...defaultMetarial, diffuseReflection: 0, reflection: 1, specularRefection: 1, shininess: 5 }

export let models: Model[] = []

// walls
let A = new Vec3(L, 0, z_front)
let B = new Vec3(0, 0, z_front)
let C = new Vec3(L, 0, L)
let D = new Vec3(0, 0, L)
let E = new Vec3(L, L, z_front)
let F = new Vec3(0, L, z_front)
let G = new Vec3(L, L, L)
let H = new Vec3(0, L, L)

// floor
models.push(new Model(wallBeige, [new Triangle(C, B, A), new Triangle(C, D, B)]))

// left
models.push(new Model(wallRed, [new Triangle(A, E, C), new Triangle(C, E, G)]))

// right
models.push(new Model(wallGreen, [new Triangle(F, B, D), new Triangle(H, F, D)]))

// front wall
models.push(new Model(wallBeige, [new Triangle(G, D, C), new Triangle(G, H, D)]))

// wall behind camera
// new Triangle(F, E, A, wallBeige),
// new Triangle(F, A, B, wallBeige),

// ceiling with hole
const holeRadius = 75
let I = new Vec3(L / 2 + holeRadius, L, L / 2 - holeRadius)
let J = new Vec3(L / 2 - holeRadius, L, L / 2 - holeRadius)
let K = new Vec3(L / 2 + holeRadius, L, L / 2 + holeRadius)
let L2 = new Vec3(L / 2 - holeRadius, L, L / 2 + holeRadius)
let M = new Vec3(L / 2 + holeRadius, L, z_front)
let N = new Vec3(L / 2 - holeRadius, L, z_front)
let O = new Vec3(L / 2 + holeRadius, L, L + 5)
let P = new Vec3(L / 2 - holeRadius, L, L + 5)
E = new Vec3(L + 5, L, z_front)
F = new Vec3(-5, L, z_front)
G = new Vec3(L + 5, L, L + 5)
H = new Vec3(-5, L, L + 5)

// ceiling
models.push(
  new Model(wallBeige, [
    new Triangle(E, M, G),
    new Triangle(M, O, G),
    new Triangle(M, N, I),
    new Triangle(N, J, I),
    new Triangle(N, F, P),
    new Triangle(F, H, P),
    new Triangle(K, L2, O),
    new Triangle(L2, P, O),
    // full ceiling
    // new Triangle(E, F, G, wallBeige),
    // new Triangle(F, H, G, wallBeige),
  ])
)

// light hole
models.push(new Model(lightMaterial, [new Triangle(L2, K, I), new Triangle(L2, I, J)]))

// frame around light
const lightBoxHeight = 5
M = new Vec3(L / 2 + holeRadius, L - lightBoxHeight, L / 2 - holeRadius)
N = new Vec3(L / 2 - holeRadius, L - lightBoxHeight, L / 2 - holeRadius)
O = new Vec3(L / 2 + holeRadius, L - lightBoxHeight, L / 2 + holeRadius)
P = new Vec3(L / 2 - holeRadius, L - lightBoxHeight, L / 2 + holeRadius)
models.push(
  new Model(lightBoxMaterial, [
    new Triangle(I, J, M),
    new Triangle(J, N, M),
    new Triangle(J, L2, N),
    new Triangle(L2, P, N),
    new Triangle(L2, K, O),
    new Triangle(L2, O, P),
    new Triangle(I, M, O),
    new Triangle(K, I, O),
  ])
)

// short block
A = new Vec3(290, 0, 114)
B = new Vec3(130, 0, 65)
C = new Vec3(240, 0, 272)
D = new Vec3(82, 0, 225)
E = new Vec3(290, 165, 114)
F = new Vec3(130, 165, 65)
G = new Vec3(240, 165, 272)
H = new Vec3(82, 165, 225)

models.push(
  new Model(blockBlue, [
    new Triangle(E, B, A),
    new Triangle(E, F, B),
    new Triangle(F, D, B),
    new Triangle(F, H, D),
    new Triangle(H, C, D),
    new Triangle(H, G, C),
    new Triangle(G, E, C),
    new Triangle(E, A, C),
    new Triangle(G, F, E),
    new Triangle(G, H, F),
  ])
)

// tall block
A = new Vec3(423, 0, 247)
B = new Vec3(265, 0, 296)
C = new Vec3(472, 0, 406)
D = new Vec3(314, 0, 456)
E = new Vec3(423, 330, 247)
F = new Vec3(265, 330, 296)
G = new Vec3(472, 330, 406)
H = new Vec3(314, 330, 456)

models.push(
  new Model(blockOrange, [
    new Triangle(E, B, A),
    new Triangle(E, F, B),
    new Triangle(F, D, B),
    new Triangle(F, H, D),
    new Triangle(H, C, D),
    new Triangle(H, G, C),
    new Triangle(G, E, C),
    new Triangle(E, A, C),
    new Triangle(G, F, E),
    new Triangle(G, H, F),
  ])
)

// sphere
models.push(new Model(sphereMaterial, [new Sphere(new Vec3(200, 165 + 40, 120), 40)]))

models.forEach((m) => m.scale(L))
