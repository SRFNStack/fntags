// Bundles the js-framework-benchmark fntags entry against a local fntags
// source instead of the npm package, without editing the benchmark repo.
//
//   JSFB_ENTRY  the entry dir (frameworks/keyed/fntags), set by run.mjs
//   FNTAGS_SRC  fntags.mjs to bundle, defaults to this checkout's src
//
// Only fntags.mjs is aliased, not index.js, because index.js also re-exports
// fnroute.mjs, which has module level side effects.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import terser from '@rollup/plugin-terser'

const here = path.dirname(fileURLToPath(import.meta.url))
const entry = process.env.JSFB_ENTRY
if (!entry) throw new Error('JSFB_ENTRY is not set')
const fntagsSrc = path.resolve(process.env.FNTAGS_SRC || path.join(here, '..', '..', 'src', 'fntags.mjs'))
console.log(`[fntags] bundling ${fntagsSrc}`)

export default {
  input: path.join(entry, 'src', 'Main.js'),
  output: { file: path.join(entry, 'dist', 'Main.js'), format: 'es', sourcemap: false, plugins: [terser()] },
  plugins: [{
    name: 'local-fntags',
    resolveId: id => id === '@srfnstack/fntags' ? fntagsSrc : null
  }]
}
