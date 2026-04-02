/**
 * Vite plugin that enables hot module reloading for fntags applications.
 *
 * During development, this plugin:
 * 1. Rewrites `fnstate()` calls to `registeredState()` so state survives module reloads
 * 2. Injects `import.meta.hot.accept()` so Vite hot-updates modules instead of full-reloading
 *
 * @returns {import('vite').Plugin}
 */
export default function fntagsHmr () {
  return {
    name: 'vite-plugin-fntags',
    apply: 'serve',

    transform (code, id) {
      if (!/\.(mjs|js|ts)$/.test(id)) return null
      if (id.includes('node_modules')) return null

      // Don't transform fntags source files — their state is managed internally
      if (/fntags(\.mjs)?$/.test(id) || /fnroute(\.mjs)?$/.test(id)) return null

      const fnstatePattern = /\b(const|let|var)\s+(\w+)\s*=\s*fnstate\s*\(/g
      if (!fnstatePattern.test(code)) return null

      // Reset lastIndex after the test() call consumed it
      fnstatePattern.lastIndex = 0

      let transformed = code

      // Add registeredState to the existing fntags import
      const importPattern = /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*fntags(?:\.mjs)?)['"]/
      const importMatch = transformed.match(importPattern)

      if (importMatch && !importMatch[1].includes('registeredState')) {
        transformed = transformed.replace(
          importMatch[0],
          `import {${importMatch[1]}, registeredState } from '${importMatch[2]}'`
        )
      }

      // Build a stable file ID by stripping the project root prefix and file extension.
      // This produces IDs like 'src/counter' that remain consistent across machines.
      const fileId = id.replace(/^.*?\/src\//, 'src/').replace(/\.[^.]+$/, '')

      // Rewrite: const count = fnstate(0)  →  const count = registeredState('src/counter:count', 0)
      transformed = transformed.replace(
        /\b(const|let|var)\s+(\w+)\s*=\s*fnstate\s*\(/g,
        (match, decl, varName) =>
          `${decl} ${varName} = registeredState('${fileId}:${varName}', `
      )

      // Tell Vite this module can accept its own hot updates
      if (!transformed.includes('import.meta.hot')) {
        transformed += '\nif (import.meta.hot) { import.meta.hot.accept(); }\n'
      }

      return { code: transformed, map: null }
    }
  }
}
