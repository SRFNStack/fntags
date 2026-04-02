import spliffy from '@srfnstack/spliffy'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

spliffy({
  routeDir: path.join(__dirname, 'routes'),
  port: 10420,
  logAccess: true,
  printRoutes: true
})
