import { RayTracing } from './raytracing'
import { stats } from './stats'

new RayTracing({ useAntialias: true })

console.log(JSON.stringify(stats, null, 2))
