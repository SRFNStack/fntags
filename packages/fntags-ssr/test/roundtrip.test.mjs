/**
 * @vitest-environment happy-dom
 *
 * Full round-trip tests: renderToString on server → hydrate on client.
 * These verify that the entire SSR flow works end-to-end.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { h, registeredState, fnstate } from '@srfnstack/fntags'
import { div, button, span, ul, li, p, h1, input } from '@srfnstack/fntags/fnelements'
import { renderToString } from '../src/index.mjs'
import { hydrate } from '../src/hydrate.mjs'

describe('SSR round-trip', () => {
  let container

  beforeEach(() => {
    globalThis.__fntags_registry = undefined
    window.__FNTAGS_SSR_STATE__ = undefined
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('server HTML matches hydrated HTML for a static component', async () => {
    const App = () => div({ class: 'app' },
      h1('Hello SSR'),
      p('This was server-rendered.')
    )

    const { html } = await renderToString({
      url: '/',
      appFn: () => App()
    })

    container.innerHTML = html

    const serverSnapshot = container.innerHTML

    hydrate(container, () => App())

    // Structure should be identical
    expect(container.innerHTML).toBe(serverSnapshot)
  })

  it('state round-trips correctly and is interactive after hydration', async () => {
    const App = () => {
      const count = registeredState('count', 10)
      return div(
        count.bindAs(n => span({ id: 'count' }, String(n))),
        button({ id: 'inc', onclick: () => count(count() + 1) }, '+')
      )
    }

    // Server render
    const { html, state } = await renderToString({
      url: '/',
      appFn: () => App()
    })

    expect(state.count).toBe(10)
    expect(html).toContain('10')

    // Simulate the browser receiving the HTML
    container.innerHTML = html
    window.__FNTAGS_SSR_STATE__ = state

    // Hydrate
    hydrate(container, () => App())

    // Verify state was restored
    expect(container.querySelector('#count').textContent).toBe('10')

    // Verify interactivity works
    container.querySelector('#inc').click()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(container.querySelector('#count').textContent).toBe('11')
  })

  it('complex state types survive round-trip', async () => {
    const App = () => {
      const data = registeredState('data', {
        name: 'Alice',
        scores: [100, 95, 87],
        meta: { active: true, role: null }
      })
      return div(
        span({ id: 'name' }, data().name),
        span({ id: 'scores' }, data().scores.join(',')),
        span({ id: 'active' }, String(data().meta.active)),
        span({ id: 'role' }, String(data().meta.role))
      )
    }

    const { html, state } = await renderToString({
      url: '/',
      appFn: () => App()
    })

    container.innerHTML = html
    window.__FNTAGS_SSR_STATE__ = state

    hydrate(container, () => App())

    expect(container.querySelector('#name').textContent).toBe('Alice')
    expect(container.querySelector('#scores').textContent).toBe('100,95,87')
    expect(container.querySelector('#active').textContent).toBe('true')
    expect(container.querySelector('#role').textContent).toBe('null')

    // Verify the actual state object fidelity
    const data = registeredState('data', {})
    expect(data().meta.active).toBe(true)
    expect(data().meta.role).toBe(null)
    expect(data().scores).toEqual([100, 95, 87])
  })

  it('multiple states round-trip independently', async () => {
    const App = () => {
      const name = registeredState('name', 'Bob')
      const count = registeredState('count', 5)
      const items = registeredState('items', ['a', 'b'])
      return div(
        span({ id: 'name' }, name()),
        span({ id: 'count' }, String(count())),
        span({ id: 'items' }, items().join(','))
      )
    }

    const { html, state } = await renderToString({
      url: '/',
      appFn: () => App()
    })

    container.innerHTML = html
    window.__FNTAGS_SSR_STATE__ = state

    hydrate(container, () => App())

    expect(container.querySelector('#name').textContent).toBe('Bob')
    expect(container.querySelector('#count').textContent).toBe('5')
    expect(container.querySelector('#items').textContent).toBe('a,b')

    // Mutate one state, verify others unaffected
    registeredState('count', 0)(99)
    expect(registeredState('name', '')()).toBe('Bob')
    expect(registeredState('items', [])()).toEqual(['a', 'b'])
  })

  it('event listeners work after round-trip with bindAs', async () => {
    const App = () => {
      const items = registeredState('items', ['first'])
      return div(
        button({ id: 'add', onclick: () => items([...items(), `item-${items().length}`]) }, 'Add'),
        items.bindAs(list =>
          ul({ id: 'list' }, list.map(i => li(i)))
        )
      )
    }

    const { html, state } = await renderToString({
      url: '/',
      appFn: () => App()
    })

    container.innerHTML = html
    window.__FNTAGS_SSR_STATE__ = state

    hydrate(container, () => App())

    expect(container.querySelectorAll('li').length).toBe(1)

    // Click add three times
    container.querySelector('#add').click()
    await new Promise(resolve => setTimeout(resolve, 0))
    container.querySelector('#add').click()
    await new Promise(resolve => setTimeout(resolve, 0))
    container.querySelector('#add').click()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(container.querySelectorAll('li').length).toBe(4)
  })

  it('bindAttr survives round-trip', async () => {
    const App = () => {
      const cls = registeredState('cls', 'active')
      return div(
        span({ id: 'target', class: cls.bindAttr() }, 'test'),
        button({ id: 'toggle', onclick: () => cls(cls() === 'active' ? 'inactive' : 'active') }, 'Toggle')
      )
    }

    const { html, state } = await renderToString({
      url: '/',
      appFn: () => App()
    })

    container.innerHTML = html
    window.__FNTAGS_SSR_STATE__ = state

    hydrate(container, () => App())

    expect(container.querySelector('#target').className).toBe('active')

    container.querySelector('#toggle').click()
    expect(container.querySelector('#target').className).toBe('inactive')
  })

  it('bindStyle survives round-trip', async () => {
    const App = () => {
      const color = registeredState('color', 'red')
      return div(
        span({ id: 'target', style: { color: color.bindStyle() } }, 'colored'),
        button({ id: 'change', onclick: () => color('blue') }, 'Blue')
      )
    }

    const { html, state } = await renderToString({
      url: '/',
      appFn: () => App()
    })

    container.innerHTML = html
    window.__FNTAGS_SSR_STATE__ = state

    hydrate(container, () => App())

    expect(container.querySelector('#target').style.color).toBe('red')

    container.querySelector('#change').click()
    expect(container.querySelector('#target').style.color).toBe('blue')
  })
})
