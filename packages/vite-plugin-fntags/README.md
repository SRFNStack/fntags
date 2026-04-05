# vite-plugin-fntags

Hot module reloading for [fntags](https://github.com/SRFNStack/fntags). Edit your components, save, and see changes instantly — without losing state.

## Quick Start

```bash
npm install --save-dev vite-plugin-fntags
```

Add the plugin to your Vite config:

```javascript
// vite.config.mjs
import { defineConfig } from 'vite'
import fntagsHmr from 'vite-plugin-fntags'

export default defineConfig({
  plugins: [fntagsHmr()]
})
```

Use `hmrRoot` in your entry file to mount your app. It returns the container element, so you can create and mount in one expression:

```javascript
// main.js
import { hmrRoot, div } from '@srfnstack/fntags'
import { App } from './app.js'

document.body.append(hmrRoot(div({ id: 'app' }), App))
```

Or if you already have a container element in your HTML:

```javascript
hmrRoot(document.getElementById('app'), App)
```

That's it. Edit any component, save, and your state is preserved. The plugin automatically triggers a re-render when any module with `fnstate` is updated.

## What It Does

During development, the plugin does two things:

1. **Rewrites `fnstate()` calls** so state instances survive module reloads
2. **Injects HMR accept calls** so Vite hot-updates modules instead of full-reloading

Production builds are not affected — the plugin only runs during `vite dev`.

## How It Works

This section explains the HMR implementation in depth — useful if you're building a framework and want to understand how to add HMR support.

### The Problem

When Vite hot-replaces a module, it re-executes the module's top-level code. For a framework with reactive state, this means every `const count = fnstate(0)` creates a **new** state instance, resetting its value to `0`. Meanwhile, the DOM still references the **old** state. You end up with the new module's code creating new DOM with fresh state, while the old DOM (still on screen) is bound to the old, now-orphaned state.

You need to solve two problems:
1. **Preserve state identity** — the same `fnstate` call in the re-executed module must return the same state object as before
2. **Re-render the DOM** — the new code must produce new DOM bound to the preserved state, and that new DOM must replace the old DOM on screen

### Solution Part 1 — State Registry

The simplest approach is a global registry that maps stable IDs to state instances:

```javascript
export function registeredState (id, initialValue, mapKey) {
  if (!globalThis.__fntags_registry) {
    globalThis.__fntags_registry = new Map()
  }
  const registry = globalThis.__fntags_registry
  if (registry.has(id)) {
    return registry.get(id)    // Return existing state — value is preserved
  }
  const state = fnstate(initialValue, mapKey)
  registry.set(id, state)      // First time — create and store
  return state
}
```

The registry lives on `globalThis`, which survives module reloads (Vite re-executes modules but doesn't wipe the global scope). Each state gets an ID based on its file path, enclosing function scope, and variable name — e.g. `'src/counter:Counter:count'`. When the module re-executes after HMR, `registeredState` finds the existing state in the registry and returns it. The `initialValue` argument is ignored — the state keeps whatever value the user set during the session.

This is the entire persistence mechanism. No serialization, no diffing, no proxies — just a Map keyed by stable IDs.

### Solution Part 2 — Code Transform

Asking users to manually call `registeredState('src/counter:count', 0)` everywhere would be awful DX. Instead, the Vite plugin's `transform` hook rewrites the code automatically:

```
// What you write:
import { fnstate } from '@srfnstack/fntags'
const count = fnstate(0)

// What the browser executes during dev:
import { fnstate, registeredState } from '@srfnstack/fntags'
const count = registeredState('src/counter:count', 0)
```

The transform parses the module into an AST (using Rollup's built-in `this.parse()`) and walks it with `estree-walker`. This lets the plugin track the **enclosing function scope** of each `fnstate()` call, producing IDs that include the scope chain:

```
// Top-level state:
const count = fnstate(0)           → registeredState('src/counter:count', 0)

// State inside a component function:
function Counter() {
  const count = fnstate(0)         → registeredState('src/counter:Counter:count', 0)
}

// Nested scopes:
function App() {
  function Counter() {
    const count = fnstate(0)       → registeredState('src/counter:App>Counter:count', 0)
  }
}
```

Scope-aware IDs are important because `fnstate` is typically called inside component functions (like React hooks). Without scope tracking, two components in the same file declaring `const count = fnstate(0)` would collide on the same registry key. The scope chain ensures each call site gets a unique, stable ID — stable across reordering components and inserting lines.

The plugin uses `magic-string` for source modifications, which preserves sourcemap accuracy. It also patches the import statement, appending `registeredState` to the existing fntags import.

Files that don't contain `fnstate(` are skipped entirely (a quick regex pre-check returns `null` before parsing).

### Solution Part 3 — HMR Accept

Vite needs to know that a module can handle its own updates. The plugin appends this to every transformed file:

```javascript
if (import.meta.hot) { import.meta.hot.accept(); }
```

This tells Vite: "when this file changes, re-execute it in place." Since the state is preserved via the registry, re-execution just rebinds the new functions to the existing state instances. The `import.meta.hot` guard ensures this code is tree-shaken in production builds.

### Solution Part 4 — Re-rendering

State is preserved, but the DOM still shows the old render. The entry point uses `hmrRoot`:

```javascript
export function hmrRoot (container, appFn) {
  const render = () => {
    container.innerHTML = ''
    const result = typeof appFn === 'function' ? appFn() : appFn
    container.appendChild(renderNode(result))
  }
  render()
  globalThis.__fntags_hmr_rerender = render
  return container
}
```

`hmrRoot` registers a global rerender callback. The plugin's injected accept handler calls it automatically — no manual HMR wiring needed in the entry file:

```javascript
hmrRoot(document.getElementById('app'), App)
```

When you save a file:
1. Vite detects the change and sends the updated module to the browser
2. The module re-executes — `registeredState` returns the existing state objects
3. The plugin's injected accept callback calls `globalThis.__fntags_hmr_rerender()`
4. The rerender clears the container and calls the `App` function again
5. The new `App` code runs, producing DOM bound to the preserved state
6. The new DOM is appended to the container with the current state values intact

### Complete Example

Here's a counter app showing the full picture:

```javascript
// src/counter.js
import { fnstate } from '@srfnstack/fntags'
import { div, button, span } from '@srfnstack/fntags/fnelements'

export const Counter = () => {
  const count = fnstate(0)
  return div(
    button({ onclick: () => count(count() - 1) }, '-'),
    span(count.bindAs(n => ` ${n} `)),
    button({ onclick: () => count(count() + 1) }, '+')
  )
}
```

```javascript
// src/app.js
import { div } from '@srfnstack/fntags/fnelements'
import { Counter } from './counter.js'

export const App = () => div(Counter())
```

```javascript
// main.js
import { hmrRoot } from '@srfnstack/fntags'
import { App } from './src/app.js'

hmrRoot(document.getElementById('app'), App)
```

Click the `+` button a few times to set count to 5. Now edit `counter.js` — change the button text from `-` to `minus`. Save. The counter still reads 5, but the button now says "minus". State preserved, new code applied.

Behind the scenes, the plugin transformed `counter.js` to:

```javascript
import { fnstate, registeredState } from '@srfnstack/fntags'

export const Counter = () => {
  const count = registeredState('src/counter:Counter:count', 0)
  // ... rest of the file unchanged ...
}
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    if (globalThis.__fntags_hmr_rerender) globalThis.__fntags_hmr_rerender()
  })
}
```

The state ID includes `Counter` because `fnstate` is called inside the `Counter` arrow function. If you had another component in the same file also declaring `const count = fnstate(0)`, it would receive a different ID based on its own enclosing function name.

## Limitations

- **Only variable declarations are rewritten.** `const count = fnstate(0)` is rewritten. `someArray.push(fnstate(0))` is not — anonymous state has no variable name to derive an ID from, so it resets on reload.
- **State shape changes require a full reload.** If you change `fnstate(0)` to `fnstate({ count: 0 })`, the registry still returns the old numeric value. Press Ctrl+R / Cmd+R when you change state shape.
- **Dev only.** The plugin sets `apply: 'serve'`, so production builds use normal `fnstate` with zero overhead. `registeredState` is still available as an export but is not used unless explicitly called.

## API

| Export | Description |
|--------|-------------|
| `fntagsHmr()` | Returns a Vite plugin object. Add to `plugins` array in `vite.config.mjs`. |
| `registeredState(id, initialValue, mapKey?)` | Get or create a state instance from the global registry. Exported from `@srfnstack/fntags`. |
| `hmrRoot(container, appFn)` | Mount an app with HMR support. Returns the container element. Exported from `@srfnstack/fntags`. |

## License

MIT
