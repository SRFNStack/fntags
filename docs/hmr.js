import { div, p, code, a, b, h3, ul, li, table, thead, tbody, tr, th, td } from './lib/fnelements.mjs'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
  contentSection(
    'Vite Plugin',
    p(b('vite-plugin-fntags'), ' gives you instant feedback when developing fntags apps with ', a({ href: 'https://vite.dev' }, 'Vite'), '. Edit a component, save, and see the change immediately — without losing state or reloading the page.')
  ),
  contentSection(
    'Install',
    prismCode('npm install --save-dev vite-plugin-fntags'),
    p('The plugin has a peer dependency on ', code('vite >= 5.0.0'), '. You also need ', code('@srfnstack/fntags >= 1.2.4'), ' for the ', code('registeredState'), ' and ', code('hmrRoot'), ' exports.')
  ),
  contentSection(
    'Setup',
    p('Add the plugin to your Vite config:'),
    prismCode(
`import { defineConfig } from 'vite'
import fntagsHmr from 'vite-plugin-fntags'

export default defineConfig({
  plugins: [fntagsHmr()]
})`
    ),
    p('In your entry file, use ', code('hmrRoot'), ' to mount your app:'),
    prismCode(
`import { hmrRoot } from '@srfnstack/fntags'
import { App } from './app.js'

const { rerender } = hmrRoot(document.getElementById('app'), App)

if (import.meta.hot) {
  import.meta.hot.accept('./app.js', () => rerender())
}`
    ),
    p('That\'s it. Every component you edit will hot-reload with state preserved.')
  ),
  contentSection(
    'Example',
    p('Here\'s a counter component. Click it a few times, then change the button text in your editor and save. The count stays the same.'),
    prismCode(
`import { fnstate } from '@srfnstack/fntags'
import { div, button, span } from '@srfnstack/fntags/fnelements'

const count = fnstate(0)

export const Counter = () =>
  div(
    button({ onclick: () => count(count() - 1) }, '-'),
    span({ style: 'margin: 0 12px; font-size: 24px;' },
      count.bindAs(n => \`\${n}\`)
    ),
    button({ onclick: () => count(count() + 1) }, '+')
  )`
    ),
    p('The app file just composes components as usual:'),
    prismCode(
`import { div, h1 } from '@srfnstack/fntags/fnelements'
import { Counter } from './counter.js'

export const App = () => div(h1('My App'), Counter())`
    )
  ),
  contentSection(
    'What It Does',
    p('During ', code('vite dev'), ', the plugin does two things:'),
    p(b('1. Rewrites fnstate calls'), ' — ', code('const count = fnstate(0)'), ' becomes ', code("const count = registeredState('src/counter:count', 0)"), '. The ', code('registeredState'), ' function stores the state in a global registry so it survives when Vite re-executes the module.'),
    p(b('2. Injects HMR accept'), ' — appends ', code('import.meta.hot.accept()'), ' to every file that uses ', code('fnstate'), ', telling Vite to hot-update the module instead of doing a full page reload.'),
    p('Production builds are not affected. The plugin only runs during ', code('vite dev'), '.')
  ),
  contentSection(
    'How It Works',
    p('This section explains the full implementation. It\'s useful if you\'re building a framework and want to understand how to add HMR support.'),
    h3({ id: 'the-problem', style: 'border-bottom: none; font-size: 18px;' }, 'The Problem'),
    p('When Vite hot-replaces a module, it re-executes the module\'s top-level code. For a reactive framework, this means every ', code('const count = fnstate(0)'), ' creates a ', b('new'), ' state instance, resetting its value to 0. The DOM still references the old state. You need to solve two problems:'),
    ul(
      li('Preserve state identity — the same ', code('fnstate'), ' call must return the same state object after reload'),
      li('Re-render the DOM — new code must produce new DOM bound to the preserved state')
    ),
    h3({ id: 'state-registry', style: 'border-bottom: none; font-size: 18px;' }, 'Part 1 — State Registry'),
    p('The simplest approach is a global registry that maps stable IDs to state instances. The registry lives on ', code('globalThis'), ', which survives module reloads.'),
    prismCode(
`export function registeredState (id, initialValue, mapKey) {
  if (!globalThis.__fntags_registry) {
    globalThis.__fntags_registry = new Map()
  }
  const registry = globalThis.__fntags_registry
  if (registry.has(id)) {
    return registry.get(id)    // Return existing — value preserved
  }
  const state = fnstate(initialValue, mapKey)
  registry.set(id, state)      // First time — create and store
  return state
}`
    ),
    p('Each state gets an ID based on file path and variable name: ', code("'src/counter:count'"), '. When the module re-executes, ', code('registeredState'), ' finds the existing state and returns it. The ', code('initialValue'), ' argument is ignored — the state keeps whatever value the user set.'),
    h3({ id: 'code-transform', style: 'border-bottom: none; font-size: 18px;' }, 'Part 2 — Code Transform'),
    p('Users shouldn\'t have to call ', code('registeredState'), ' manually. The Vite plugin\'s ', code('transform'), ' hook rewrites the code automatically:'),
    prismCode(
`// What you write:
const count = fnstate(0)

// What the browser executes during dev:
const count = registeredState('src/counter:count', 0)`
    ),
    p('The transform uses regex, not an AST parser:'),
    prismCode(
      '/\\b(const|let|var)\\s+(\\w+)\\s*=\\s*fnstate\\s*\\(/g'
    ),
    p(code('fnstate('), ' is a unique enough token that false positives aren\'t a concern. The ', code('const/let/var name ='), ' prefix captures the variable name for the ID. No need for babel or swc — the regex is fast and covers real-world usage.'),
    p('The plugin also patches the import, appending ', code('registeredState'), ' to the existing fntags import.'),
    h3({ id: 'hmr-accept', style: 'border-bottom: none; font-size: 18px;' }, 'Part 3 — HMR Accept'),
    p('Vite needs to know a module can handle its own updates. The plugin appends this to every transformed file:'),
    prismCode(
      'if (import.meta.hot) { import.meta.hot.accept(); }'
    ),
    p('This tells Vite: "re-execute this module in place instead of full-reloading." Since state is preserved via the registry, re-execution just rebinds the new functions to existing state. The ', code('import.meta.hot'), ' guard is tree-shaken in production builds.'),
    h3({ id: 'rerendering', style: 'border-bottom: none; font-size: 18px;' }, 'Part 4 — Re-rendering'),
    p('State is preserved, but the DOM still shows the old render. The entry point uses ', code('hmrRoot'), ':'),
    prismCode(
`export function hmrRoot (container, appFn) {
  const render = () => {
    container.innerHTML = ''
    const result = typeof appFn === 'function' ? appFn() : appFn
    container.appendChild(renderNode(result))
  }
  render()
  return { container, rerender: render }
}`
    ),
    p('When you save a file:'),
    ul(
      li('Vite sends the updated module to the browser'),
      li(code('registeredState'), ' returns the existing state objects'),
      li('The entry point\'s accept callback calls ', code('rerender()')),
      li(code('rerender()'), ' clears the container and re-invokes the app function'),
      li('New DOM is produced bound to the preserved state with its current values')
    )
  ),
  contentSection(
    'Limitations',
    ul(
      li(b('Only variable declarations are rewritten.'), ' ', code('const count = fnstate(0)'), ' is rewritten. ', code('arr.push(fnstate(0))'), ' is not — anonymous state resets on reload.'),
      li(b('State shape changes need a full reload.'), ' If you change ', code('fnstate(0)'), ' to ', code('fnstate({ count: 0 })'), ', the registry returns the old numeric value. Press Ctrl+R when you change state shape.'),
      li(b('Dev only.'), ' The plugin sets ', code("apply: 'serve'"), ', so production builds use normal ', code('fnstate'), ' with zero overhead.')
    )
  ),
  contentSection(
    'API Reference',
    table({ style: 'width: 100%; border-collapse: collapse;' },
      thead(tr(
        th({ style: 'text-align: left; padding: 8px; border-bottom: 2px solid #ddd;' }, 'Export'),
        th({ style: 'text-align: left; padding: 8px; border-bottom: 2px solid #ddd;' }, 'Description')
      )),
      tbody(
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('fntagsHmr()')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Returns a Vite plugin. Add to ', code('plugins'), ' array in ', code('vite.config.mjs'), '.')
        ),
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('registeredState(id, initialValue, mapKey?)')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Get or create state from the global registry. Exported from ', code('@srfnstack/fntags'), '.')
        ),
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('hmrRoot(container, appFn)')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Mount an app with HMR support. Returns ', code('{ container, rerender }'), '. Exported from ', code('@srfnstack/fntags'), '.')
        )
      )
    )
  )
)
