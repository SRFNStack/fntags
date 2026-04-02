import { defineConfig } from 'vite'
import fntagsHmr from 'vite-plugin-fntags'
import path from 'path'

// Point at local fntags source so we get registeredState/hmrRoot before they're published
const fntagsRoot = path.resolve(import.meta.dirname, '../../..')

export default defineConfig({
  plugins: [fntagsHmr()],
  resolve: {
    alias: {
      '@srfnstack/fntags/fnelements': path.join(fntagsRoot, 'src/fnelements.mjs'),
      '@srfnstack/fntags': path.join(fntagsRoot, 'src/fntags.mjs')
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:10420'
    }
  }
})
