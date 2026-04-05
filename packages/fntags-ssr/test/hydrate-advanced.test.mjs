/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { h, registeredState, fnstate } from '@srfnstack/fntags'
import { div, button, span, ul, li, input } from '@srfnstack/fntags/fnelements'
import { hydrate } from '../src/hydrate.mjs'

describe('hydrate advanced', () => {
  let container

  beforeEach(() => {
    globalThis.__fntags_registry = undefined
    globalThis.__FNTAGS_SSR_STATE__ = undefined
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('restores multiple states from snapshot', () => {
    container.innerHTML = '<div>Alice30</div>'
    window.__FNTAGS_SSR_STATE__ = { name: 'Alice', age: 30 }

    hydrate(container, () => {
      const name = registeredState('name', 'default')
      const age = registeredState('age', 0)
      return div(name(), String(age()))
    })

    expect(registeredState('name', '')(/* get */)). toBe('Alice')
    expect(registeredState('age', 0)()).toBe(30)
  })

  it('handles object state values', () => {
    container.innerHTML = '<div>Alice</div>'
    window.__FNTAGS_SSR_STATE__ = { user: { name: 'Alice', role: 'admin' } }

    hydrate(container, () => {
      const user = registeredState('user', {})
      return div(user().name)
    })

    const user = registeredState('user', {})
    expect(user().name).toBe('Alice')
    expect(user().role).toBe('admin')
  })

  it('handles array state values', () => {
    container.innerHTML = '<ul><li>a</li><li>b</li></ul>'
    window.__FNTAGS_SSR_STATE__ = { items: ['a', 'b', 'c'] }

    hydrate(container, () => {
      const items = registeredState('items', [])
      return ul(items().map(i => li(i)))
    })

    expect(registeredState('items', [])()).toEqual(['a', 'b', 'c'])
    expect(container.querySelectorAll('li').length).toBe(3)
  })

  it('bindAttr works after hydration', () => {
    container.innerHTML = '<div class="on"></div>'
    window.__FNTAGS_SSR_STATE__ = { active: 'on' }

    hydrate(container, () => {
      const active = registeredState('active', 'off')
      return h('div', { class: active.bindAttr() })
    })

    expect(container.firstChild.className).toBe('on')

    // Mutate — bindAttr is synchronous
    const active = registeredState('active', 'off')
    active('off')
    expect(container.firstChild.className).toBe('off')
  })

  it('bindStyle works after hydration', () => {
    container.innerHTML = '<div style="color: red;">text</div>'
    window.__FNTAGS_SSR_STATE__ = { color: 'red' }

    hydrate(container, () => {
      const color = registeredState('color', 'black')
      return h('div', { style: { color: color.bindStyle() } }, 'text')
    })

    expect(container.firstChild.style.color).toBe('red')

    const color = registeredState('color', 'black')
    color('green')
    expect(container.firstChild.style.color).toBe('green')
  })

  it('multiple event listeners work after hydration', () => {
    container.innerHTML = '<div><button>A</button><button>B</button></div>'

    const clicks = []
    hydrate(container, () => {
      return div(
        button({ onclick: () => clicks.push('a') }, 'A'),
        button({ onclick: () => clicks.push('b') }, 'B')
      )
    })

    container.querySelectorAll('button')[1].click()
    container.querySelectorAll('button')[0].click()
    expect(clicks).toEqual(['b', 'a'])
  })

  it('bindChildren works after hydration', async () => {
    container.innerHTML = '<ul><li>x</li><li>y</li></ul>'
    window.__FNTAGS_SSR_STATE__ = { list: ['x', 'y'] }

    hydrate(container, () => {
      const list = registeredState('list', [], v => v)
      return list.bindChildren(h('ul'), (item) =>
        h('li', item.bindAs())
      )
    })

    expect(container.querySelectorAll('li').length).toBe(2)

    // Add item
    const list = registeredState('list', [], v => v)
    list(['x', 'y', 'z'])
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(container.querySelectorAll('li').length).toBe(3)
  })

  it('hydrates with no container content gracefully', () => {
    // Empty container — first SSR render or error case
    container.innerHTML = ''

    hydrate(container, () => {
      return div(span('fresh render'))
    })

    expect(container.querySelector('span').textContent).toBe('fresh render')
  })

  it('passes element directly instead of function', () => {
    container.innerHTML = '<p>old</p>'

    const el = h('p', 'new')
    hydrate(container, el)

    expect(container.querySelector('p').textContent).toBe('new')
  })

  it('overwrites state even when object values are deeply equal', () => {
    // hydrate uses reference equality (state() !== value). Since JSON.parse
    // creates new references, object states are always overwritten. Verify
    // the final value is correct regardless.
    container.innerHTML = '<div>Alice</div>'
    window.__FNTAGS_SSR_STATE__ = { user: { name: 'Alice' } }

    // Pre-create state with identical-looking but different-reference default
    const existing = registeredState('user', { name: 'Alice' })

    hydrate(container, () => {
      const user = registeredState('user', {})
      return div(user().name)
    })

    // The state should hold the snapshot value
    const user = registeredState('user', {})
    expect(user().name).toBe('Alice')
  })

  it('can be called twice on the same container', async () => {
    container.innerHTML = '<div>first</div>'
    window.__FNTAGS_SSR_STATE__ = { val: 'first' }

    hydrate(container, () => {
      const val = registeredState('val', 'default')
      return div(val.bindAs(v => span(v)))
    })
    expect(container.querySelector('span').textContent).toBe('first')

    // Hydrate again with new state
    globalThis.__fntags_registry = undefined
    window.__FNTAGS_SSR_STATE__ = { val: 'second' }

    hydrate(container, () => {
      const val = registeredState('val', 'default')
      return div(val.bindAs(v => span(v)))
    })
    expect(container.querySelector('span').textContent).toBe('second')
  })

  it('handles snapshot with extra keys the app does not use', () => {
    container.innerHTML = '<div>hello</div>'
    window.__FNTAGS_SSR_STATE__ = {
      used: 'yes',
      unused1: 'extra',
      unused2: [1, 2, 3]
    }

    hydrate(container, () => {
      const used = registeredState('used', 'no')
      return div(used())
    })

    expect(container.textContent).toBe('yes')
    // Extra keys were registered but not used — no crash
    expect(registeredState('unused1', '')()).toBe('extra')
  })

  it('handles empty snapshot object', () => {
    container.innerHTML = '<div>content</div>'
    window.__FNTAGS_SSR_STATE__ = {}

    hydrate(container, () => {
      return div('hydrated')
    })

    expect(container.textContent).toBe('hydrated')
  })

  it('handles snapshot with numeric and boolean values', () => {
    container.innerHTML = '<div>test</div>'
    window.__FNTAGS_SSR_STATE__ = {
      zero: 0,
      empty: '',
      no: false,
      nil: null
    }

    hydrate(container, () => {
      const zero = registeredState('zero', 999)
      const empty = registeredState('empty', 'default')
      const no = registeredState('no', true)
      const nil = registeredState('nil', 'not null')
      return div(
        span({ id: 'z' }, String(zero())),
        span({ id: 'e' }, `"${empty()}"`),
        span({ id: 'n' }, String(no())),
        span({ id: 'x' }, String(nil()))
      )
    })

    expect(container.querySelector('#z').textContent).toBe('0')
    expect(container.querySelector('#e').textContent).toBe('""')
    expect(container.querySelector('#n').textContent).toBe('false')
    expect(container.querySelector('#x').textContent).toBe('null')
  })
})
