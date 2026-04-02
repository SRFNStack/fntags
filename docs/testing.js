import { a, b, code, div, p, table, thead, tbody, tr, th, td } from './lib/fnelements.mjs'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
  contentSection(
    'Testing',
    p(b('@srfnstack/fntags-testing'), ' is a lightweight testing library for fntags, built on ', a({ href: 'https://testing-library.com/docs/dom-testing-library/intro' }, '@testing-library/dom'), '.'),
    p('Since fntags components are plain functions that return real DOM elements, testing them is straightforward. There\'s no virtual DOM to mock, no component lifecycle to simulate. You render your component, query the DOM, fire events, and assert results — just like you would in a browser.'),
    p('The library provides a ', code('render()'), ' function to mount your components and re-exports the full ', code('@testing-library/dom'), ' API for queries, events, and async utilities.')
  ),

  contentSection(
    'Setup',
    p('Install the testing library and a test runner. We recommend ', a({ href: 'https://vitest.dev' }, 'Vitest'), ' with ', a({ href: 'https://github.com/nicolo-ribaudo/happy-dom' }, 'happy-dom'), ' for fast, browser-like testing in Node.js.'),
    prismCode(
      'npm install --save-dev @srfnstack/fntags-testing vitest happy-dom'
    ),
    p('Create a ', code('vitest.config.mjs'), ' in your project root:'),
    prismCode(
`import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true
  }
})`
    ),
    p('Add a test script to your ', code('package.json'), ':'),
    prismCode(
`{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}`
    )
  ),

  contentSection(
    'Basic Rendering',
    p('The ', code('render()'), ' function mounts a DOM element or component function into the document and returns query helpers scoped to that content.'),
    prismCode(
`import { render } from '@srfnstack/fntags-testing'
import { div, span } from '@srfnstack/fntags/fnelements'

it('renders a plain element', () => {
  const { container } = render(div(span('hello'), span('world')))
  expect(container.textContent).toContain('hello')
})`
    ),
    p('You can pass a component function directly — ', code('render()'), ' will call it for you:'),
    prismCode(
`import { h, fnstate } from '@srfnstack/fntags'

const Greeting = () => h('div', 'Hello, world!')

it('renders a component function', () => {
  const { container } = render(Greeting)
  expect(container.textContent).toBe('Hello, world!')
})`
    ),
    p('The returned object also includes:'),
    div({ style: 'padding-left: 20px' },
      p(code('container'), ' — the wrapper DOM element containing your rendered content'),
      p(code('unmount()'), ' — removes the rendered content and cleans up the container'),
      p(code('debug()'), ' — prints a formatted snapshot of the DOM to the console (useful for debugging)'),
      p('All ', code('@testing-library/dom'), ' query functions (', code('getByText'), ', ', code('getByRole'), ', etc.) scoped to the container')
    )
  ),

  contentSection(
    'Querying Elements',
    p('Use the standard ', code('@testing-library/dom'), ' queries to find elements. These are available both from the ', code('render()'), ' return value (scoped to the container) and from ', code('screen'), ' (scoped to the whole document).'),
    prismCode(
`import { render, screen, within } from '@srfnstack/fntags-testing'
import { div, button, ul, li } from '@srfnstack/fntags/fnelements'

it('finds elements by text', () => {
  render(div(button('Submit'), button('Cancel')))
  expect(screen.getByText('Submit').tagName).toBe('BUTTON')
})

it('finds elements by role', () => {
  render(button('Save'))
  expect(screen.getByRole('button')).toBeTruthy()
})

it('scopes queries with within()', () => {
  const { container } = render(
    div(
      ul(li('Apple'), li('Banana')),
      ul(li('Cat'), li('Dog'))
    )
  )
  const firstList = container.querySelectorAll('ul')[0]
  expect(within(firstList).getByText('Apple')).toBeTruthy()
})`
    )
  ),

  contentSection(
    'Events',
    p('Use ', code('fireEvent'), ' to simulate user interactions. Event handlers on fntags elements work exactly like native DOM handlers.'),
    prismCode(
`import { render, screen, fireEvent } from '@srfnstack/fntags-testing'
import { div, button, input } from '@srfnstack/fntags/fnelements'
import { fnstate } from '@srfnstack/fntags'

it('handles click events', () => {
  let clicked = false
  render(button({ onclick: () => { clicked = true } }, 'Click me'))
  fireEvent.click(screen.getByText('Click me'))
  expect(clicked).toBe(true)
})

it('handles input events', () => {
  const value = fnstate('')
  render(input({
    placeholder: 'Type here',
    oninput: (e) => value(e.target.value)
  }))

  const el = screen.getByPlaceholderText('Type here')
  fireEvent.input(el, { target: { value: 'hello' } })
  expect(value()).toBe('hello')
})`
    )
  ),

  contentSection(
    'Testing State Changes',
    p('fntags has two kinds of reactive updates, and they behave differently in tests:'),
    p(b('Synchronous'), ' — ', code('bindAttr'), ' and ', code('bindStyle'), ' update the DOM immediately when state changes. You can assert right after setting state.'),
    prismCode(
`import { h, fnstate } from '@srfnstack/fntags'
import { render } from '@srfnstack/fntags-testing'

it('bindAttr updates synchronously', () => {
  const color = fnstate('red')
  const { container } = render(h('div', { class: color.bindAttr() }))
  expect(container.firstChild.className).toBe('red')

  color('blue')
  // No waiting needed — DOM is already updated
  expect(container.firstChild.className).toBe('blue')
})`
    ),
    p(b('Asynchronous'), ' — ', code('bindAs'), ' re-renders via microtask (using ', code('Promise'), '). Use ', code('waitFor()'), ' to wait for the DOM to update.'),
    prismCode(
`import { h, fnstate } from '@srfnstack/fntags'
import { render, screen, waitFor } from '@srfnstack/fntags-testing'

it('bindAs updates via waitFor', async () => {
  const count = fnstate(0)
  render(h('div', count.bindAs(n => h('span', \`Count: \${n}\`))))

  expect(screen.getByText('Count: 0')).toBeTruthy()

  count(1)
  await waitFor(() => {
    expect(screen.getByText('Count: 1')).toBeTruthy()
  })
})`
    ),
    p('A simple flush helper also works if you prefer:'),
    prismCode(
`const flush = () => new Promise(resolve => setTimeout(resolve, 0))

it('using flush instead of waitFor', async () => {
  const name = fnstate('Alice')
  render(h('div', name.bindAs(n => h('span', n))))

  name('Bob')
  await flush()
  expect(screen.getByText('Bob')).toBeTruthy()
})`
    )
  ),

  contentSection(
    'Testing Lists (bindChildren)',
    p(code('bindChildren'), ' renders array state as a list of DOM elements. Updates are synchronous for item addition/removal (no microtask), but if you use ', code('bindAs'), ' inside each item, those re-renders are async.'),
    prismCode(
`import { h, fnstate } from '@srfnstack/fntags'
import { render, waitFor } from '@srfnstack/fntags-testing'

it('renders and updates a list', async () => {
  const items = fnstate(['Apple', 'Banana', 'Cherry'], v => v)

  const { container } = render(
    items.bindChildren(
      h('ul'),
      (itemState) => h('li', itemState.bindAs())
    )
  )

  expect(container.querySelectorAll('li').length).toBe(3)
  expect(container.textContent).toContain('Banana')

  // Remove an item
  items(['Apple', 'Cherry'])
  await waitFor(() => {
    expect(container.querySelectorAll('li').length).toBe(2)
  })

  // Add items
  items(['Apple', 'Cherry', 'Date', 'Elderberry'])
  await waitFor(() => {
    expect(container.querySelectorAll('li').length).toBe(4)
  })
})`
    )
  ),

  contentSection(
    'Full Component Example',
    p('Here\'s a complete test for a Todo app component, combining rendering, queries, events, and async state updates:'),
    prismCode(
`import { describe, it, expect } from 'vitest'
import { fnstate } from '@srfnstack/fntags'
import { div, h1, ul, li, input, button } from '@srfnstack/fntags/fnelements'
import { render, screen, fireEvent, waitFor } from '@srfnstack/fntags-testing'

const TodoApp = () => {
  const todos = fnstate(['Buy milk', 'Walk dog'], v => v)
  const newTodo = fnstate('')

  return div(
    h1('Todos'),
    todos.bindChildren(ul(), (todo) => li(todo.bindAs())),
    input({
      placeholder: 'New todo',
      oninput: (e) => newTodo(e.target.value)
    }),
    button({
      onclick: () => {
        if (newTodo()) {
          todos([...todos(), newTodo()])
          newTodo('')
        }
      }
    }, 'Add')
  )
}

describe('TodoApp', () => {
  it('renders initial todos', () => {
    render(TodoApp)
    expect(screen.getByText('Todos')).toBeTruthy()
    expect(screen.getByText('Buy milk')).toBeTruthy()
    expect(screen.getByText('Walk dog')).toBeTruthy()
  })

  it('adds a new todo', async () => {
    render(TodoApp)
    const todoInput = screen.getByPlaceholderText('New todo')
    fireEvent.input(todoInput, { target: { value: 'Read book' } })
    fireEvent.click(screen.getByText('Add'))

    await waitFor(() => {
      expect(screen.getByText('Read book')).toBeTruthy()
    })
  })
})`, null, '700px'
    )
  ),

  contentSection(
    'Cleanup',
    p(code('cleanup()'), ' removes all rendered containers and drains pending microtasks. It is ', b('automatically called'), ' between tests when ', code('afterEach'), ' is available (which it is in Vitest, Jest, and Mocha).'),
    p('You only need to call it manually if your test framework doesn\'t provide ', code('afterEach'), ':'),
    prismCode(
`import { cleanup } from '@srfnstack/fntags-testing'

// Only needed if afterEach is not available
afterAll(() => cleanup())`
    )
  ),

  contentSection(
    'API Reference',
    table({ style: 'width: 100%; border-collapse: collapse; margin: 10px 0;' },
      thead(
        tr(
          th({ style: 'text-align: left; padding: 8px; border-bottom: 2px solid #ddd;' }, 'Export'),
          th({ style: 'text-align: left; padding: 8px; border-bottom: 2px solid #ddd;' }, 'Description')
        )
      ),
      tbody(
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('render(elementOrFn, options?)')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Mount an element or component function. Returns ', code('{ container, baseElement, unmount, debug, ...queries }'))
        ),
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('cleanup()')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Remove all rendered containers and drain microtasks. Auto-called between tests.')
        ),
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('screen')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Pre-bound queries scoped to ', code('document.body'), '. Use when you don\'t need a specific container reference.')
        ),
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('fireEvent')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Fire DOM events (', code('.click()'), ', ', code('.input()'), ', ', code('.change()'), ', etc.)')
        ),
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('waitFor(callback)')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Retry a callback until it passes. Essential for asserting after ', code('bindAs'), ' re-renders.')
        ),
        tr(
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, code('within(element)')),
          td({ style: 'padding: 8px; border-bottom: 1px solid #eee;' }, 'Scope queries to a specific DOM element.')
        )
      )
    )
  )
)
