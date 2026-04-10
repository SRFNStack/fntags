import spliffy, { moduleDirname } from '@srfnstack/spliffy'
import path from 'path'

const __dirname = moduleDirname(import.meta.url)

spliffy({
  routeDir: path.join(__dirname, 'www'),
  port: 3000,
  printRoutes: true,
  defaultRoute: '/',
  nodeModuleRoutes: {
    files: [
      '@srfnstack/fntags/index.js',
      '@srfnstack/fntags/src/fntags.mjs',
      '@srfnstack/fntags/src/fnroute.mjs',
      '@srfnstack/fntags/src/fnelements.mjs',
      '@srfnstack/fntags/src/svgelements.mjs',
      '@srfnstack/fntags-ssr/src/hydrate.mjs'
    ]
  }
})
