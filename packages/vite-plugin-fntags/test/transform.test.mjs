import { describe, it, expect } from 'vitest'
import fntagsHmr from '../src/index.mjs'

describe('vite-plugin-fntags transform', () => {
  const plugin = fntagsHmr()
  const transform = (code, id = '/project/src/counter.mjs') => plugin.transform(code, id)

  it('rewrites fnstate calls to registeredState', () => {
    const code = `import { fnstate } from '@srfnstack/fntags'
const count = fnstate(0)`

    const result = transform(code)
    expect(result).not.toBeNull()
    expect(result.code).toContain("const count = registeredState('src/counter:count', 0)")
  })

  it('adds registeredState to the import', () => {
    const code = `import { fnstate } from '@srfnstack/fntags'
const count = fnstate(0)`

    const result = transform(code)
    expect(result.code).toContain('registeredState }')
    expect(result.code).toMatch(/import\s*\{[^}]*registeredState[^}]*\}\s*from\s*'@srfnstack\/fntags'/)
  })

  it('does not duplicate registeredState if already imported', () => {
    const code = `import { fnstate, registeredState } from '@srfnstack/fntags'
const count = fnstate(0)`

    const result = transform(code)
    const matches = result.code.match(/registeredState/g)
    // One in the import, one in the rewritten call
    expect(matches.length).toBe(2)
  })

  it('injects import.meta.hot.accept()', () => {
    const code = `import { fnstate } from '@srfnstack/fntags'
const count = fnstate(0)`

    const result = transform(code)
    expect(result.code).toContain('if (import.meta.hot) { import.meta.hot.accept(); }')
  })

  it('does not inject import.meta.hot if already present', () => {
    const code = `import { fnstate } from '@srfnstack/fntags'
const count = fnstate(0)
if (import.meta.hot) { import.meta.hot.accept(); }`

    const result = transform(code)
    const matches = result.code.match(/import\.meta\.hot/g)
    // Two occurrences: the if condition and the accept call
    expect(matches.length).toBe(2)
  })

  it('handles multiple fnstate declarations', () => {
    const code = `import { fnstate } from '@srfnstack/fntags'
const count = fnstate(0)
let name = fnstate('world')
var items = fnstate([], v => v.id)`

    const result = transform(code)
    expect(result.code).toContain("const count = registeredState('src/counter:count', 0)")
    expect(result.code).toContain("let name = registeredState('src/counter:name', 'world')")
    expect(result.code).toContain("var items = registeredState('src/counter:items', [], v => v.id)")
  })

  it('uses file path as part of the state ID', () => {
    const code = `import { fnstate } from '@srfnstack/fntags'
const count = fnstate(0)`

    const result = transform(code, '/project/src/components/header.mjs')
    expect(result.code).toContain("registeredState('src/components/header:count'")
  })

  it('returns null for files without fnstate', () => {
    const code = `import { h } from '@srfnstack/fntags'
export const App = () => h('div', 'hello')`

    const result = transform(code)
    expect(result).toBeNull()
  })

  it('returns null for node_modules files', () => {
    const code = `import { fnstate } from '@srfnstack/fntags'
const count = fnstate(0)`

    const result = transform(code, '/project/node_modules/some-lib/index.mjs')
    expect(result).toBeNull()
  })

  it('returns null for fntags source files', () => {
    const code = `const count = fnstate(0)`

    expect(transform(code, '/project/src/fntags.mjs')).toBeNull()
    expect(transform(code, '/project/src/fnroute.mjs')).toBeNull()
  })

  it('returns null for non-JS files', () => {
    const code = `const count = fnstate(0)`

    expect(transform(code, '/project/src/style.css')).toBeNull()
    expect(transform(code, '/project/src/data.json')).toBeNull()
  })

  it('does not rewrite fnstate calls that are not variable declarations', () => {
    const code = `import { fnstate } from '@srfnstack/fntags'
const count = fnstate(0)
someArray.push(fnstate(1))`

    const result = transform(code)
    // The variable declaration is rewritten
    expect(result.code).toContain("const count = registeredState('src/counter:count', 0)")
    // The push call is NOT rewritten (no const/let/var prefix)
    expect(result.code).toContain('someArray.push(fnstate(1))')
  })

  it('handles .mjs import paths', () => {
    const code = `import { fnstate } from './lib/fntags.mjs'
const count = fnstate(0)`

    const result = transform(code)
    expect(result.code).toMatch(/import\s*\{[^}]*registeredState[^}]*\}\s*from\s*'\.\/lib\/fntags\.mjs'/)
  })

  it('plugin is configured for dev only', () => {
    expect(plugin.apply).toBe('serve')
  })

  it('plugin has the correct name', () => {
    expect(plugin.name).toBe('vite-plugin-fntags')
  })
})
