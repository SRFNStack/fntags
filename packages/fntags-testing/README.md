# @srfnstack/fntags-testing

A lightweight testing library for [fntags](https://github.com/SRFNStack/fntags), built on [@testing-library/dom](https://testing-library.com/docs/dom-testing-library/intro).

fntags components are plain functions that return real DOM elements. No virtual DOM, no component wrappers, no special test utilities needed. This library gives you a `render()` function and re-exports the standard @testing-library/dom API — that's it.

## Setup

```bash
npm install --save-dev @srfnstack/fntags-testing vitest happy-dom
```

Create a `vitest.config.mjs`:

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true
  }
})
```

## Usage

### Render and Query

```javascript
import { render, screen } from '@srfnstack/fntags-testing'
import { div, button } from '@srfnstack/fntags/fnelements'

it('renders elements', () => {
  render(div(button('Submit'), button('Cancel')))
  expect(screen.getByText('Submit').tagName).toBe('BUTTON')
})
```

Pass a component function directly — `render()` calls it for you:

```javascript
const Greeting = () => div('Hello, world!')

it('renders a component function', () => {
  render(Greeting)
  expect(screen.getByText('Hello, world!')).toBeTruthy()
})
```

### Events

```javascript
import { render, screen, fireEvent } from '@srfnstack/fntags-testing'
import { button } from '@srfnstack/fntags/fnelements'

it('handles clicks', () => {
  let clicked = false
  render(button({ onclick: () => { clicked = true } }, 'Go'))
  fireEvent.click(screen.getByText('Go'))
  expect(clicked).toBe(true)
})
```

### State Changes

`bindAttr` and `bindStyle` update synchronously. `bindAs` re-renders via microtask — use `waitFor()`:

```javascript
import { render, screen, waitFor } from '@srfnstack/fntags-testing'
import { h, fnstate } from '@srfnstack/fntags'

it('updates after state change', async () => {
  const count = fnstate(0)
  render(h('div', count.bindAs(n => h('span', `Count: ${n}`))))

  expect(screen.getByText('Count: 0')).toBeTruthy()

  count(1)
  await waitFor(() => {
    expect(screen.getByText('Count: 1')).toBeTruthy()
  })
})
```

### Lists

```javascript
import { render, waitFor } from '@srfnstack/fntags-testing'
import { h, fnstate } from '@srfnstack/fntags'

it('renders a list', async () => {
  const items = fnstate(['Apple', 'Banana'], v => v)

  const { container } = render(
    items.bindChildren(h('ul'), (item) => h('li', item.bindAs()))
  )

  expect(container.querySelectorAll('li').length).toBe(2)

  items(['Apple', 'Banana', 'Cherry'])
  await waitFor(() => {
    expect(container.querySelectorAll('li').length).toBe(3)
  })
})
```

## API

| Export | Description |
|--------|-------------|
| `render(elementOrFn, options?)` | Mount an element or component function. Returns `{ container, unmount, debug, ...queries }` |
| `cleanup()` | Remove all rendered containers. Auto-called between tests. |
| `screen` | Pre-bound queries scoped to `document.body` |
| `fireEvent` | Fire DOM events (`.click()`, `.input()`, `.change()`, etc.) |
| `waitFor(callback)` | Retry until a callback passes. Use after `bindAs` state changes. |
| `within(element)` | Scope queries to a specific DOM element |

## Cleanup

`cleanup()` is automatically called between tests when `afterEach` is available (Vitest, Jest, Mocha). It removes all rendered containers and drains pending microtasks so `bindAs` replacements don't leak between tests.

## License

MIT
