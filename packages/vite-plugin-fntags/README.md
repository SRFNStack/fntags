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

Use `hmrRoot` in your entry file to mount your app:

```javascript
// main.js
import { hmrRoot } from '@srfnstack/fntags'
import { App } from './app.js'

const { rerender } = hmrRoot(document.getElementById('app'), App)

if (import.meta.hot) {
  import.meta.hot.accept('./app.js', () => {
    rerender()
  })
}
```

That's it. Edit any component, save, and your state is preserved.

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

The registry lives on `globalThis`, which survives module reloads (Vite re-executes modules but doesn't wipe the global scope). Each state gets an ID based on its file path and variable name: `'src/counter:count'`. When the module re-executes after HMR, `registeredState('src/counter:count', 0)` finds the existing state in the registry and returns it. The `initialValue` argument is ignored — the state keeps whatever value the user set during the session.

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

The transform uses regex, not an AST parser:

```javascript
// Match: const/let/var <name> = fnstate(
const fnstatePattern = /\b(const|let|var)\s+(\w+)\s*=\s*fnstate\s*\(/g
```

Why regex instead of babel/swc?
- `fnstate(` is a unique enough token — it's not a common word that would false-positive
- The `const/let/var name =` prefix gives us the variable name for the ID
- Regex is fast — no parser startup cost, no AST allocation
- The rewrite is simple string substitution, not structural transformation

Match group `$1` is the declaration keyword (`const`/`let`/`var`), group `$2` is the variable name. The replacement inserts the `registeredState` call with the file-scoped ID:

```javascript
`${decl} ${varName} = registeredState('${fileId}:${varName}', `
```

The plugin also patches the import statement, appending `registeredState` to the existing fntags import so no extra import line is needed.

Files that don't contain `fnstate(` are skipped entirely (the regex test returns `null` before any string manipulation).

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
  return { container, rerender: render }
}
```

The entry file's HMR callback calls `rerender()`:

```javascript
const { rerender } = hmrRoot(document.getElementById('app'), App)

if (import.meta.hot) {
  import.meta.hot.accept('./app.js', () => {
    rerender()
  })
}
```

When you save a file:
1. Vite detects the change and sends the updated module to the browser
2. The module re-executes — `registeredState` returns the existing state objects
3. The entry point's accept callback fires, calling `rerender()`
4. `rerender()` clears the container and calls the `App` function again
5. The new `App` code runs, producing DOM bound to the preserved state
6. The new DOM is appended to the container with the current state values intact

### Complete Example

Here's a counter app showing the full picture:

```javascript
// src/counter.js
import { fnstate } from '@srfnstack/fntags'
import { div, button, span } from '@srfnstack/fntags/fnelements'

const count = fnstate(0)

export const Counter = () =>
  div(
    button({ onclick: () => count(count() - 1) }, '-'),
    span(count.bindAs(n => ` ${n} `)),
    button({ onclick: () => count(count() + 1) }, '+')
  )
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

const { rerender } = hmrRoot(document.getElementById('app'), App)

if (import.meta.hot) {
  import.meta.hot.accept('./src/app.js', () => rerender())
}
```

Click the `+` button a few times to set count to 5. Now edit `counter.js` — change the button text from `-` to `minus`. Save. The counter still reads 5, but the button now says "minus". State preserved, new code applied.

Behind the scenes, the plugin transformed `counter.js` to:

```javascript
import { fnstate, registeredState } from '@srfnstack/fntags'
const count = registeredState('src/counter:count', 0)
// ... rest of the file unchanged ...
if (import.meta.hot) { import.meta.hot.accept(); }
```

## Limitations

- **Only variable declarations are rewritten.** `const count = fnstate(0)` is rewritten. `someArray.push(fnstate(0))` is not — anonymous state has no variable name to derive an ID from, so it resets on reload.
- **State shape changes require a full reload.** If you change `fnstate(0)` to `fnstate({ count: 0 })`, the registry still returns the old numeric value. Press Ctrl+R / Cmd+R when you change state shape.
- **Dev only.** The plugin sets `apply: 'serve'`, so production builds use normal `fnstate` with zero overhead. `registeredState` is still available as an export but is not used unless explicitly called.

## API

| Export | Description |
|--------|-------------|
| `fntagsHmr()` | Returns a Vite plugin object. Add to `plugins` array in `vite.config.mjs`. |
| `registeredState(id, initialValue, mapKey?)` | Get or create a state instance from the global registry. Exported from `@srfnstack/fntags`. |
| `hmrRoot(container, appFn)` | Mount an app with HMR support. Returns `{ container, rerender }`. Exported from `@srfnstack/fntags`. |

## License

MIT
