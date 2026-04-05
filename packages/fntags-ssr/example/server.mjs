import spliffy, { moduleDirname } from '@srfnstack/spliffy'
import path from 'path'

const __dirname = moduleDirname(import.meta.url)

spliffy({
  routeDir: path.join(__dirname, 'www'),
  port: 3000,
  printRoutes: true
})
