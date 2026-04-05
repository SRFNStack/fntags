import { walk } from 'estree-walker'
import MagicString from 'magic-string'

function isFunctionNode (node) {
  return node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
}

/**
 * Derive a human-readable scope name for a function node from its declaration
 * or the variable/property it is assigned to.
 */
function getScopeName (node, parent) {
  if (node.type === 'FunctionDeclaration' && node.id) return node.id.name
  if (node.type === 'FunctionExpression' && node.id) return node.id.name
  if (parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') return parent.id.name
  if (parent?.type === 'Property' && parent.key) return parent.key.name || parent.key.value
  if (parent?.type === 'MethodDefinition' && parent.key) return parent.key.name || parent.key.value
  if (parent?.type === 'AssignmentExpression' && parent.left?.type === 'Identifier') return parent.left.name
  return null
}

/**
 * Vite plugin that enables hot module reloading for fntags applications.
 *
 * During development, this plugin:
 * 1. Rewrites `fnstate()` calls to `registeredState()` so state survives module reloads
 * 2. Injects `import.meta.hot.accept()` so Vite hot-updates modules instead of full-reloading
 *
 * State IDs include the enclosing function scope chain so that identically-named
 * variables in different functions (e.g. two components both declaring `const count = fnstate(0)`)
 * receive distinct registry keys.
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

      if (!/\bfnstate\s*\(/.test(code)) return null

      const ast = this.parse(code)
      const s = new MagicString(code)

      // Build a stable file ID by stripping the project root prefix and file extension.
      // This produces IDs like 'src/counter' that remain consistent across machines.
      const fileId = id.replace(/^.*?\/src\//, 'src/').replace(/\.[^.]+$/, '')

      let needsRegisteredState = false
      const scopeStack = []

      walk(ast, {
        enter (node, parent) {
          if (isFunctionNode(node)) {
            const name = getScopeName(node, parent)
            node.__scopeName = name
            if (name) scopeStack.push(name)
          }

          // Match: const/let/var x = fnstate(...)
          if (
            node.type === 'VariableDeclarator' &&
            node.id?.type === 'Identifier' &&
            node.init?.type === 'CallExpression' &&
            node.init.callee?.type === 'Identifier' &&
            node.init.callee.name === 'fnstate'
          ) {
            const varName = node.id.name
            const scopePath = scopeStack.join('>')
            const stateId = scopePath
              ? `${fileId}:${scopePath}:${varName}`
              : `${fileId}:${varName}`

            // Rewrite: fnstate( → registeredState(
            s.overwrite(node.init.callee.start, node.init.callee.end, 'registeredState')

            // Insert state ID as the first argument
            if (node.init.arguments.length > 0) {
              s.appendLeft(node.init.arguments[0].start, `'${stateId}', `)
            } else {
              s.appendLeft(node.init.end - 1, `'${stateId}'`)
            }

            needsRegisteredState = true
          }
        },
        leave (node) {
          if (isFunctionNode(node) && node.__scopeName) {
            scopeStack.pop()
          }
        }
      })

      if (!needsRegisteredState) return null

      // Add registeredState to the existing fntags import
      const fntagsImport = ast.body.find(n =>
        n.type === 'ImportDeclaration' &&
        /fntags(\.mjs)?$/.test(n.source.value)
      )
      if (fntagsImport) {
        const hasIt = fntagsImport.specifiers.some(sp =>
          sp.type === 'ImportSpecifier' && sp.imported.name === 'registeredState'
        )
        if (!hasIt && fntagsImport.specifiers.length > 0) {
          const last = fntagsImport.specifiers[fntagsImport.specifiers.length - 1]
          s.appendLeft(last.end, ', registeredState')
        }
      }

      // Tell Vite this module can accept its own hot updates
      if (!code.includes('import.meta.hot')) {
        s.append('\nif (import.meta.hot) { import.meta.hot.accept(); }\n')
      }

      return { code: s.toString(), map: s.generateMap({ hires: true }) }
    }
  }
}
