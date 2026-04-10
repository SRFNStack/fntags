import { a, b, code, div, p, table, thead, tbody, tr, th, td } from './lib/fnelements.mjs'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
  contentSection(
    'Server-Side Rendering',
    p(b('@srfnstack/fntags-ssr'), ' adds server-side rendering and client-side hydration to fntags. Render your components to HTML on the server for a fast first paint, then hydrate on the client to attach event listeners and resume interactivity.'),
    p('Because fntags components are plain functions that return real DOM elements, SSR works without any changes to your component code. The same component tree runs identically on both server and client.')
  ),

  contentSection(
    'Install',
    prismCode(
      'npm install @srfnstack/fntags-ssr'
    ),
    p('This installs both the server-side rendering API and the client-side hydration API. ', a({ href: 'https://github.com/nicolo-ribaudo/happy-dom' }, 'happy-dom'), ' is included as a dependency and is only used on the server — it is never bundled into client code.')
  ),

  contentSection(
    'Basic Setup',
    p('SSR has two sides: the server renders HTML, and the client hydrates it. The key is that both sides use the ', b('same component function'), '.'),
    p('First, write your app component as a normal fntags function:'),
    prismCode(
`// app.mjs — shared between server and client
import { h, registeredState } from '@srfnstack/fntags'
import { div, h1, p, button, span } from '@srfnstack/fntags/fnelements'

export function App () {
  const count = registeredState('count', 0)
  return div(
    h1('My App'),
    p('Count: ', count.bindAs(n => span(String(n)))),
    button({ onclick: () => count(count() + 1) }, '+1')
  )
}`
    ),
    p('On the server, use ', code('renderToString'), ' to render it to HTML. ', b('Important:'), ' use a dynamic ', code('import()'), ' inside ', code('appFn'), ' rather than a static import at the top of the file. ', code('fnroute'), ' accesses ', code('window'), ' at module level when it initializes, and ', code('renderToString'), ' sets up the DOM environment before calling ', code('appFn'), ', so a dynamic import ensures fntags loads after ', code('window'), ' exists on the server.'),
    prismCode(
`// server.mjs
import { renderToString, escapeScriptContent } from '@srfnstack/fntags-ssr'

const { html, state } = await renderToString({
  url: '/',
  appFn: async () => {
    const { App } = await import('./app.mjs')
    return App()
  }
})

// Serve this as an HTML response:
// escapeScriptContent prevents XSS if state values contain </script>
const page = \`<!DOCTYPE html>
<html>
<body>
  <div id="app">\${html}</div>
  <script>
    window.__FNTAGS_SSR_STATE__ = \${escapeScriptContent(JSON.stringify(state))}
  </script>
  <script type="module" src="/client.mjs"></script>
</body>
</html>\``
    ),
    p('On the client, call ', code('hydrate'), ' to make the page interactive. Since the client script runs in the browser, bare specifiers like ', code('@srfnstack/fntags'), ' need to be resolved. Use an ', a({ href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap' }, 'import map'), ' in your HTML (before any ', code('<script type="module">'), ' tags) to map them to URLs your server serves:'),
    prismCode(
`<!-- In your HTML <head>, before module scripts -->
<script type="importmap">
{
  "imports": {
    "@srfnstack/fntags": "/path/to/fntags/index.js",
    "@srfnstack/fntags-ssr/hydrate": "/path/to/fntags-ssr/src/hydrate.mjs"
  }
}
</script>`
    ),
    p('The import map applies to all modules on the page, including internal imports within fntags-ssr. Relative imports within the fntags source resolve naturally as long as the directory structure is preserved when serving.'),
    prismCode(
`// client.mjs — served as a static file
import { hydrate } from '@srfnstack/fntags-ssr/hydrate'
import { App } from './app.mjs'

hydrate(document.getElementById('app'), () => App())`
    ),
    p('That\'s it. The server renders the initial HTML so the page appears instantly, and the client re-executes the component tree to attach event listeners, reactive bindings, and state subscriptions.')
  ),

  contentSection(
    'State Serialization',
    p('SSR automatically serializes and restores any state created with ', code('registeredState'), '. This is the same API used for HMR state preservation — if you\'re already using it, SSR state transfer works with zero changes.'),
    prismCode(
`import { registeredState } from '@srfnstack/fntags'

// This state will be serialized by the server and restored on the client.
const user = registeredState('user', { name: 'Alice', role: 'admin' })
const items = registeredState('items', ['one', 'two', 'three'])`
    ),
    p('On the server, ', code('renderToString'), ' captures a snapshot of every registered state. The snapshot is a plain object mapping state IDs to their current values:'),
    prismCode(
`const { state } = await renderToString({
  url: '/',
  appFn: async () => {
    const { App } = await import('./app.mjs')
    return App()
  }
})
// state === { user: { name: 'Alice', role: 'admin' }, items: ['one', 'two', 'three'] }`
    ),
    p('Embed the snapshot in your HTML page so the client can read it:'),
    prismCode(
`<script>window.__FNTAGS_SSR_STATE__ = \${escapeScriptContent(JSON.stringify(state))}</script>`
    ),
    p('On the client, ', code('hydrate'), ' reads ', code('window.__FNTAGS_SSR_STATE__'), ' and populates the registry before your app factory runs. Each ', code('registeredState'), ' call returns the server value instead of the default.'),
    p('States created with plain ', code('fnstate()'), ' are ', b('not serialized'), '. They will initialize from their default values on the client. Use ', code('registeredState'), ' for any state that should survive the server-to-client handoff.')
  ),

  contentSection(
    'Routing',
    p('SSR works with ', code('fnroute'), ' out of the box. Pass the target URL to ', code('renderToString'), ' and it configures ', code('pathState'), ' before rendering, so ', code('route()'), ', ', code('routeSwitch()'), ', and ', code('pathParameters'), ' all work as expected.'),
    prismCode(
`import { renderToString } from '@srfnstack/fntags-ssr'

// Renders the /about route
const about = await renderToString({
  url: '/about',
  appFn: async () => {
    const { App } = await import('./app.mjs')
    return App()
  }
})

// Path parameters work too — /user/42 populates pathParameters().id
const user = await renderToString({
  url: '/user/42',
  appFn: async () => {
    const { App } = await import('./app.mjs')
    return App()
  }
})`
    ),
    p('If your app uses a root path prefix (e.g. it\'s mounted at ', code('/my-app/'), '), pass it as ', code('rootPath'), ':'),
    prismCode(
`await renderToString({
  url: '/about',
  rootPath: '/my-app',
  appFn: async () => {
    const { App } = await import('./app.mjs')
    return App()
  }
})`
    )
  ),

  contentSection(
    'Async Children',
    p('fntags supports promises as children — a hidden placeholder is created and replaced when the promise resolves. ', code('renderToString'), ' waits for all promise children to resolve before returning, so the output always contains the final content.'),
    prismCode(
`import { h } from '@srfnstack/fntags'

function App () {
  // This promise child works on both server and client
  const userData = fetch('/api/user').then(r => r.json())
    .then(user => h('span', user.name))

  return h('div',
    h('h1', 'Profile'),
    userData  // renderToString will wait for this
  )
}`
    ),
    p('By default, ', code('renderToString'), ' waits up to 5 seconds for promises. Use the ', code('timeout'), ' option to adjust:'),
    prismCode(
`await renderToString({
  url: '/',
  appFn: async () => {
    const { App } = await import('./app.mjs')
    return App()
  },
  timeout: 10000  // wait up to 10 seconds
})`
    ),
    p('If a promise hasn\'t resolved by the timeout, its placeholder will remain in the output as a hidden div.')
  ),

  contentSection(
    'Serving Modules to the Browser',
    p('Your server needs to serve the fntags and fntags-ssr source files so the browser can load them. The key requirements are:'),
    div({ style: 'padding-left: 20px' },
      p('1. Serve the fntags source files (', code('index.js'), ', ', code('src/fntags.mjs'), ', ', code('src/fnroute.mjs'), ', ', code('src/fnelements.mjs'), ', ', code('src/svgelements.mjs'), ') at stable URLs'),
      p('2. Serve ', code('fntags-ssr/src/hydrate.mjs'), ' at a stable URL'),
      p('3. Add an import map in your HTML that maps the bare specifiers to those URLs'),
      p('4. Place your shared app component where the browser can load it (e.g. in your static files directory)')
    ),
    p('Any Node.js server can do this — serve the files from ', code('node_modules'), ' and add the import map to your HTML template. The import map only needs entries for bare specifiers; relative imports within the fntags source resolve naturally as long as the directory structure is preserved.'),
    p('Complete working examples are available using ', a({ href: 'https://github.com/srfnstack/fntags/tree/master/packages/fntags-ssr/example' }, 'Spliffy'), ' and ', a({ href: 'https://github.com/srfnstack/fntags/tree/master/packages/fntags-ssr/express-example' }, 'Express'), '.')
  ),

  contentSection(
    'Streaming',
    p(code('renderToStream'), ' returns a ', code('ReadableStream'), ' that flushes synchronous HTML immediately and sends state as a final chunk. This gets content to the browser faster for pages with async children.'),
    prismCode(
`import { renderToStream } from '@srfnstack/fntags-ssr'

const stream = renderToStream({
  url: '/',
  appFn: async () => {
    const { App } = await import('./app.mjs')
    return App()
  }
})

// Pipe the stream to your HTTP response
// The exact API depends on your server framework`
    ),
    p(code('renderToStream'), ' takes the same options as ', code('renderToString'), '.')
  ),

  contentSection(
    'How Hydration Works',
    p('fntags has no virtual DOM — every element is a real DOM node. Because of this, hydration works by re-executing the component tree and replacing the container content. This is the same approach used by ', code('hmrRoot'), ' for hot module replacement.'),
    p('The sequence is:'),
    div({ style: 'padding-left: 20px' },
      p('1. ', code('hydrate'), ' reads the state snapshot from ', code('window.__FNTAGS_SSR_STATE__')),
      p('2. It populates the ', code('registeredState'), ' registry with server values'),
      p('3. It calls your app factory, which creates fresh DOM nodes with event listeners and reactive bindings'),
      p('4. It replaces the container\'s static server HTML with the live DOM tree')
    ),
    p('Since the same state values produce the same HTML, the replacement is visually seamless — there\'s no flash of different content.')
  ),

  contentSection(
    'renderToString Options',
    table({ style: 'width: 100%; border-collapse: collapse; margin: 10px 0;' },
      thead(
        tr(
          th({ style: 'text-align: left; padding: 8px; border-bottom: 2px solid #ddd;' }, 'Option'),
          th({ style: 'text-align: left; padding: 8px; border-bottom: 2px solid #ddd;' }, 'Type'),
          th({ style: 'text-align: left; padding: 8px; border-bottom: 2px solid #ddd;' }, 'Default'),
          th({ style: 'text-align: left; padding: 8px; border-bottom: 2px solid #ddd;' }, 'Description')
        )
      ),
      tbody(
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('url')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'string'),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, b('required')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'URL path to render (e.g. ', code('\'/about\''), ')')
        ),
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('appFn')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, '() => Node'),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, b('required')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Function that returns the app\'s root element')
        ),
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('rootPath')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'string'),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('\'/\'')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Root path prefix for routing')
        ),
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('timeout')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'number'),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('5000')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Max milliseconds to wait for async children')
        ),
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('origin')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'string'),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('\'http://localhost\'')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Origin used to construct the full URL for the DOM environment')
        )
      )
    ),
    p(code('renderToString'), ' returns ', code('Promise<{ html, state }>'), ' where ', code('html'), ' is the rendered HTML string and ', code('state'), ' is a plain object mapping registered state IDs to their values.')
  ),

  contentSection(
    'Concurrency',
    p(code('renderToString'), ' installs a temporary DOM environment on ', code('globalThis'), ' for the duration of each render. Since globals are shared, a mutex ensures only one render runs at a time. Concurrent calls are queued automatically.'),
    p('For high-throughput production scenarios, you can run renders in Node.js ', code('worker_threads'), ' — each worker has its own global scope, so renders can execute in parallel without contention.'),
    p('For most applications, the single-threaded approach is sufficient. Server-rendered pages are typically cached behind a CDN, so each unique page is only rendered once.')
  ),

  contentSection(
    'State Isolation',
    p('Each call to ', code('renderToString'), ' gets a fresh state registry. States created during one render do not leak into the next. This means you can safely render different pages with different state values without cross-contamination.'),
    prismCode(
`// These two renders are completely isolated
const appFn = async () => {
  const { App } = await import('./app.mjs')
  return App()
}

const page1 = await renderToString({ url: '/', appFn })
// registeredState('x', 'first')

const page2 = await renderToString({ url: '/', appFn })
// registeredState('x', 'second')

// page1.state.x === 'first'
// page2.state.x === 'second'`
    )
  )
)
