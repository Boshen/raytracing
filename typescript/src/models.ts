import { Vec3 } from './vec3'
import { Triangle } from './triangle'

const L = 555
const z_front = -L // closed box for mirror effect

const red = new Vec3(0.75, 0.15, 0.15)
const beige = new Vec3(0.85, 0.85, 0.7)
const blue = new Vec3(0.05, 0.6, 1)
const green = new Vec3(0.15, 0.75, 0.15)
const orange = new Vec3(0.8, 0.7, 0.05)


let A = new Vec3(L, 0, z_front)
let B = new Vec3(0, 0, z_front)
let C = new Vec3(L, 0, L)
let D = new Vec3(0, 0, L)
let E = new Vec3(L, L - 1, z_front)
let F = new Vec3(0, L - 1, z_front)
let G = new Vec3(L, L - 1, L)
let H = new Vec3(0, L - 1, L)

const walls = [
  // floor
  new Triangle(C, B, A, beige),
  new Triangle(C, D, B, beige),
  // left
  new Triangle(A, E, C, red),
  new Triangle(C, E, G, red),
  // right
  new Triangle(F, B, D, green),
  new Triangle(H, F, D, green),
  // front wall
  new Triangle(G, D, C, beige),
  new Triangle(G, H, D, beige),
  // wall behind camera
  new Triangle(F, E, A, beige),
  new Triangle(F, A, B, beige),
]

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
const ceiling = [
  new Triangle(E, M, G, beige),
  new Triangle(M, O, G, beige),
  new Triangle(M, N, I, beige),
  new Triangle(N, J, I, beige),
  new Triangle(N, F, P, beige),
  new Triangle(F, H, P, beige),
  new Triangle(K, L2, O, beige),
  new Triangle(L2, P, O, beige),
]

// light hole
const lightBoxHeight = 5
M = new Vec3(L / 2 + holeRadius, L - lightBoxHeight, L / 2 - holeRadius)
N = new Vec3(L / 2 - holeRadius, L - lightBoxHeight, L / 2 - holeRadius)
O = new Vec3(L / 2 + holeRadius, L - lightBoxHeight, L / 2 + holeRadius)
P = new Vec3(L / 2 - holeRadius, L - lightBoxHeight, L / 2 + holeRadius)
const hole = [
  new Triangle(I, J, M, beige),
  new Triangle(J, N, M, beige),
  new Triangle(J, L2, N, beige),
  new Triangle(L2, P, N, beige),
  new Triangle(L2, K, O, beige),
  new Triangle(L2, O, P, beige),
  new Triangle(I, M, O, beige),
  new Triangle(K, I, O, beige),
]

// short block
A = new Vec3(290, 0, 114)
B = new Vec3(130, 0, 65)
C = new Vec3(240, 0, 272)
D = new Vec3(82, 0, 225)
E = new Vec3(290, 165, 114)
F = new Vec3(130, 165, 65)
G = new Vec3(240, 165, 272)
H = new Vec3(82, 165, 225)

const shortBlock = [
  new Triangle(E, B, A, blue),
  new Triangle(E, F, B, blue),
  new Triangle(F, D, B, blue),
  new Triangle(F, H, D, blue),
  new Triangle(H, C, D, blue),
  new Triangle(H, G, C, blue),
  new Triangle(G, E, C, blue),
  new Triangle(E, A, C, blue),
  new Triangle(G, F, E, blue),
  new Triangle(G, H, F, blue),
]

A = new Vec3(423, 0, 247)
B = new Vec3(265, 0, 296)
C = new Vec3(472, 0, 406)
D = new Vec3(314, 0, 456)
E = new Vec3(423, 330, 247)
F = new Vec3(265, 330, 296)
G = new Vec3(472, 330, 406)
H = new Vec3(314, 330, 456)

const tallBlock = [
  new Triangle(E, B, A, orange),
  new Triangle(E, F, B, orange),
  new Triangle(F, D, B, orange),
  new Triangle(F, H, D, orange),
  new Triangle(H, C, D, orange),
  new Triangle(H, G, C, orange),
  new Triangle(G, E, C, orange),
  new Triangle(E, A, C, orange),
  new Triangle(G, F, E, orange),
  new Triangle(G, H, F, orange),
]

export const triangles = walls.concat(ceiling).concat(hole).concat(shortBlock).concat(tallBlock)

triangles.forEach((o) => o.scale(L))
