/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { h, registeredState, fnstate } from '@srfnstack/fntags'
import { hydrate } from '../src/hydrate.mjs'

describe('hydrate', () => {
  let container

  beforeEach(() => {
    globalThis.__fntags_registry = undefined
    globalThis.__FNTAGS_SSR_STATE__ = undefined
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('replaces server HTML with live DOM', () => {
    container.innerHTML = '<div><span>Hello</span></div>'

    hydrate(container, () => {
      return h('div', h('span', 'Hello'))
    })

    expect(container.innerHTML).toContain('<span>Hello</span>')
  })

  it('restores state from server snapshot', () => {
    container.innerHTML = '<div><span>42</span></div>'
    window.__FNTAGS_SSR_STATE__ = { counter: 42 }

    hydrate(container, () => {
      const count = registeredState('counter', 0)
      return h('div', h('span', String(count())))
    })

    expect(container.querySelector('span').textContent).toBe('42')

    // Verify the state was actually restored
    const count = registeredState('counter', 0)
    expect(count()).toBe(42)
  })

  it('attaches event listeners after hydration', () => {
    container.innerHTML = '<div><button>Click me</button></div>'

    let clicked = false
    hydrate(container, () => {
      return h('div',
        h('button', { onclick: () => { clicked = true } }, 'Click me')
      )
    })

    container.querySelector('button').click()
    expect(clicked).toBe(true)
  })

  it('establishes reactive bindings after hydration', async () => {
    container.innerHTML = '<div><span>initial</span></div>'
    window.__FNTAGS_SSR_STATE__ = { text: 'initial' }

    hydrate(container, () => {
      const text = registeredState('text', 'default')
      return h('div', text.bindAs(t => h('span', t)))
    })

    expect(container.querySelector('span').textContent).toBe('initial')

    // Update state - should trigger reactive update
    const text = registeredState('text', 'default')
    text('updated')

    // Wait for microtask to process bindAs update
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(container.querySelector('span').textContent).toBe('updated')
  })

  it('handles string snapshot from JSON', () => {
    container.innerHTML = '<div>test</div>'
    window.__FNTAGS_SSR_STATE__ = JSON.stringify({ key: 'value' })

    hydrate(container, () => {
      const state = registeredState('key', 'default')
      return h('div', state())
    })

    expect(container.textContent).toBe('value')
  })

  it('works without server state', () => {
    container.innerHTML = '<div><p>server content</p></div>'

    hydrate(container, () => {
      return h('div', h('p', 'client content'))
    })

    expect(container.querySelector('p').textContent).toBe('client content')
  })
})
