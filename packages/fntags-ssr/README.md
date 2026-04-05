# @srfnstack/fntags-ssr

Server-side rendering and client-side hydration for [fntags](https://github.com/SRFNStack/fntags).

Render your fntags components to HTML on the server for fast first paint, then hydrate on the client to attach event listeners and resume interactivity. No changes to the core framework required — SSR works through the existing public API.

## How It Works

fntags components are plain functions that create real DOM elements. On the server, `renderToString` uses [happy-dom](https://github.com/nicedoc/happy-dom) to provide a DOM implementation, runs your component tree, serializes the result to HTML, and captures a snapshot of any `registeredState` values. On the client, `hydrate` restores the state snapshot and re-executes the component tree to attach event listeners and reactive bindings.

## Install

```bash
npm install @srfnstack/fntags-ssr
```

`happy-dom` is included as a dependency (server-side only — it is not bundled into client code).

## Server API

### `renderToString(options)`

Renders a fntags application to an HTML string. Waits for all async children (promises) to resolve before returning.

```javascript
import { renderToString } from '@srfnstack/fntags-ssr'

const { html, state } = await renderToString({
  url: '/about',
  appFn: () => App()
})
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | `string` | *required* | URL path to render (e.g. `'/about'`) |
| `appFn` | `() => Node` | *required* | Function that returns the app's root element |
| `rootPath` | `string` | `'/'` | Root path prefix for routing |
| `timeout` | `number` | `5000` | Max ms to wait for async children |
| `origin` | `string` | `'http://localhost'` | Origin for the full URL |

**Returns:** `Promise<{ html: string, state: Record<string, any> }>`

- `html` — the rendered HTML string (the inner content, not a full document)
- `state` — a snapshot of all `registeredState` values, ready to embed in the page

### `renderToStream(options)`

Streaming variant. Flushes synchronous HTML immediately and streams state as a final `<script>` chunk. Takes the same options as `renderToString`.

```javascript
import { renderToStream } from '@srfnstack/fntags-ssr'

const stream = renderToStream({
  url: '/',
  appFn: () => App()
})
```

**Returns:** `ReadableStream<string>`

## Client API

### `hydrate(container, appFn)`

Restores server-rendered state and re-executes the component tree to attach event listeners and reactive bindings.

```javascript
import { hydrate } from '@srfnstack/fntags-ssr/hydrate'

hydrate(document.getElementById('app'), () => App())
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | `HTMLElement` | The element containing server-rendered HTML |
| `appFn` | `() => Node` | Same component factory used on the server |

## State Serialization

SSR automatically serializes all states created with `registeredState(id, value)` — the same API used for HMR state preservation. Use `registeredState` instead of `fnstate` for any state that should survive the server-to-client handoff:

```javascript
import { registeredState } from '@srfnstack/fntags'

// This state will be serialized by the server and restored on the client
const count = registeredState('count', 0)
```

On the server, `renderToString` captures a snapshot of all registered states. On the client, `hydrate` reads the snapshot from `window.__FNTAGS_SSR_STATE__` and populates the registry before your app factory runs.

**Important:** When embedding the `state` object in a `<script>` tag in your HTML template, use `escapeScriptContent` to prevent XSS from state values containing `</script>`:

```javascript
import { renderToString, escapeScriptContent } from '@srfnstack/fntags-ssr'

const { html, state } = await renderToString({ url: '/', appFn: () => App() })

const page = `
<div id="app">${html}</div>
<script>window.__FNTAGS_SSR_STATE__=${escapeScriptContent(JSON.stringify(state))}</script>
<script type="module" src="/client.mjs"></script>
`
```

States created with plain `fnstate()` are not serialized — they'll initialize with their default values on the client.

## Routing

SSR works with `fnroute` out of the box. Pass the target URL to `renderToString` and it sets `pathState` before rendering, so `route()`, `routeSwitch()`, and `pathParameters` all work as expected:

```javascript
const { html } = await renderToString({
  url: '/user/42',
  appFn: () => App()
})
// Renders the /user/:id route with pathParameters().id === '42'
```

## Full Example with Spliffy

See the [`example/`](./example) directory for a complete SSR application using [@srfnstack/spliffy](https://github.com/SRFNStack/spliffy) as the backend. It demonstrates:

- Server-side rendering with `renderToString`
- State serialization and client hydration
- Routing with `fnroute`
- Interactive state after hydration

### Quick Start

```bash
cd example
npm install
npm start
# Open http://localhost:3000
```

### How the Example Works

**Shared app** (`app/App.mjs`) — a fntags component tree with routing, state, and event handlers. Used identically on server and client.

**Server** (`server.mjs`) — a spliffy server with a catch-all route handler that calls `renderToString`, wraps the HTML in a full document shell, and embeds the state snapshot.

**Client** (`www/client.mjs`) — imports the same `App` component and calls `hydrate` to make the page interactive.

```
example/
  server.mjs              # Spliffy server entry point
  app/
    App.mjs               # Shared fntags application component
  www/                     # Spliffy route directory
    index+.rt.mjs          # Catch-all route: SSR handler
    client.mjs             # Client entry: hydration
```

## Concurrency

`renderToString` uses a mutex internally because happy-dom globals are installed on `globalThis`. Concurrent calls are serialized automatically. For high-throughput scenarios, consider running renders in Node.js worker threads.

## License

MIT
