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
 * 2. Wraps exported functions with `registeredComponent()` so callers always get the latest version
 * 3. Injects `import.meta.hot.accept()` so Vite hot-updates modules instead of full-reloading
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
      let needsRegisteredComponent = false
      const scopeStack = []
      // Track function nodes on the stack so we can tag which ones contain fnstate calls
      const functionStack = []
      const functionsWithState = new Set()

      walk(ast, {
        enter (node, parent) {
          if (isFunctionNode(node)) {
            const name = getScopeName(node, parent)
            node.__scopeName = name
            if (name) scopeStack.push(name)
            functionStack.push(node)
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
            // Tag the immediately enclosing function as containing state
            if (functionStack.length > 0) {
              functionsWithState.add(functionStack[functionStack.length - 1])
            }
          }
        },
        leave (node) {
          if (isFunctionNode(node)) {
            if (node.__scopeName) scopeStack.pop()
            functionStack.pop()
          }
        }
      })

      if (!needsRegisteredState) return null

      // Wrap exported functions that contain fnstate calls with registeredComponent
      // so callers always get the latest version after HMR.
      // Only functions that directly use fnstate are wrapped — utility functions
      // are left alone to preserve hoisting semantics.
      for (const node of ast.body) {
        // export default function name() { ... }
        if (
          node.type === 'ExportDefaultDeclaration' &&
          node.declaration?.type === 'FunctionDeclaration' &&
          node.declaration.id &&
          functionsWithState.has(node.declaration)
        ) {
          const name = node.declaration.id.name
          const compId = `${fileId}#${name}`
          // Remove 'export default ' prefix, keep the function declaration
          s.overwrite(node.start, node.declaration.start, '')
          // Append the export after the declaration
          s.appendLeft(node.end, `\nexport default registeredComponent('${compId}', ${name})`)
          needsRegisteredComponent = true
        // export function name() { ... }
        } else if (
          node.type === 'ExportNamedDeclaration' &&
          node.declaration?.type === 'FunctionDeclaration' &&
          node.declaration.id &&
          functionsWithState.has(node.declaration)
        ) {
          const name = node.declaration.id.name
          const compId = `${fileId}#${name}`
          // Remove 'export ' prefix, keep the function declaration
          s.overwrite(node.start, node.declaration.start, '')
          // Append wrapped export after the declaration
          s.appendLeft(node.end, `\nexport const ${name} = registeredComponent('${compId}', _${name})`)
          // Rename the original function to avoid conflict
          s.overwrite(node.declaration.id.start, node.declaration.id.end, '_' + name)
          needsRegisteredComponent = true
        // export const Name = () => { ... } or export const Name = function() { ... }
        } else if (
          node.type === 'ExportNamedDeclaration' &&
          node.declaration?.type === 'VariableDeclaration'
        ) {
          for (const decl of node.declaration.declarations) {
            if (
              decl.id?.type === 'Identifier' &&
              decl.init &&
              isFunctionNode(decl.init) &&
              functionsWithState.has(decl.init)
            ) {
              const name = decl.id.name
              const compId = `${fileId}#${name}`
              // Wrap the function init: () => { ... } → registeredComponent('id', () => { ... })
              s.prependLeft(decl.init.start, `registeredComponent('${compId}', `)
              s.appendLeft(decl.init.end, ')')
              needsRegisteredComponent = true
            }
          }
        }
      }

      // Add registeredState and/or registeredComponent to the existing fntags import
      const fntagsImport = ast.body.find(n =>
        n.type === 'ImportDeclaration' &&
        /fntags(\.mjs)?$/.test(n.source.value)
      )
      if (fntagsImport && fntagsImport.specifiers.length > 0) {
        const last = fntagsImport.specifiers[fntagsImport.specifiers.length - 1]
        const existing = fntagsImport.specifiers.map(sp =>
          sp.type === 'ImportSpecifier' ? sp.imported.name : null
        )
        const toAdd = []
        if (needsRegisteredState && !existing.includes('registeredState')) {
          toAdd.push('registeredState')
        }
        if (needsRegisteredComponent && !existing.includes('registeredComponent')) {
          toAdd.push('registeredComponent')
        }
        if (toAdd.length > 0) {
          s.appendLeft(last.end, ', ' + toAdd.join(', '))
        }
      }

      // Tell Vite this module can accept its own hot updates.
      // When hmrRoot is wired up, trigger a full app re-render so the new code is reflected in the DOM.
      if (!code.includes('import.meta.hot')) {
        s.append(`
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    if (globalThis.__fntags_hmr_rerender) {
      globalThis.__fntags_hmr_rerender()
    } else {
      console.warn('[vite-plugin-fntags] HMR update received for ' + ${JSON.stringify(fileId)} + ' but no hmrRoot detected — the DOM was not re-rendered. Use hmrRoot() in your entry file to enable full HMR. See: https://srfnstack.github.io/fntags/vite-plugin')
    }
  })
}
`)
      }

      return { code: s.toString(), map: s.generateMap({ hires: true }) }
    }
  }
}
