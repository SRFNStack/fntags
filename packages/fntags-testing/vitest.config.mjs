import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true
  },
  resolve: {
    alias: {
      '@srfnstack/fntags/fnelements': resolve(__dirname, '../../src/fnelements.mjs'),
      '@srfnstack/fntags/svgelements': resolve(__dirname, '../../src/svgelements.mjs'),
      '@srfnstack/fntags/fnroute': resolve(__dirname, '../../src/fnroute.mjs'),
      '@srfnstack/fntags': resolve(__dirname, '../../src/fntags.mjs')
    }
  }
})
