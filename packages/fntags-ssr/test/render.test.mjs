import { describe, it, expect, beforeEach } from 'vitest'
import { renderToString } from '../src/index.mjs'

describe('renderToString', () => {
  beforeEach(() => {
    globalThis.__fntags_registry = undefined
  })

  it('renders basic elements to HTML', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', { class: 'hello' }, h('p', 'world'))
      }
    })
    expect(html).toContain('<div class="hello">')
    expect(html).toContain('<p>world</p>')
  })

  it('renders element factories', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { div, p, span } = await import('@srfnstack/fntags/fnelements')
        return div({ class: 'container' },
          p('Hello'),
          span({ id: 'name' }, 'World')
        )
      }
    })
    expect(html).toContain('<div class="container">')
    expect(html).toContain('<p>Hello</p>')
    expect(html).toContain('<span id="name">World</span>')
  })

  it('serializes registered state', async () => {
    const { html, state } = await renderToString({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const count = registeredState('counter', 42)
        return h('div', h('span', String(count())))
      }
    })
    expect(state.counter).toBe(42)
    expect(html).toContain('42')
  })

  it('renders state bindings with initial values', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const name = registeredState('name', 'Alice')
        return h('div',
          name.bindAs(n => h('span', n))
        )
      }
    })
    expect(html).toContain('Alice')
  })

  it('waits for promise children', async () => {
    const { html } = await renderToString({
      url: '/',
      timeout: 3000,
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const asyncChild = new Promise(resolve => {
          setTimeout(() => resolve(h('span', 'loaded')), 50)
        })
        return h('div', asyncChild)
      }
    })
    expect(html).toContain('loaded')
    expect(html).not.toContain('fntags-promise-marker')
  })

  it('renders nested elements correctly', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('main',
          h('header', h('h1', 'Title')),
          h('article',
            h('p', 'Paragraph 1'),
            h('p', 'Paragraph 2')
          ),
          h('footer', 'Footer text')
        )
      }
    })
    expect(html).toContain('<main>')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<p>Paragraph 1</p>')
    expect(html).toContain('Footer text')
  })

  it('handles attributes correctly', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('input', {
          type: 'text',
          placeholder: 'Enter name'
        })
      }
    })
    expect(html).toContain('type="text"')
    expect(html).toContain('placeholder="Enter name"')
  })

  it('handles style objects', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', { style: { color: 'red', fontSize: '16px' } }, 'styled')
      }
    })
    expect(html).toContain('color')
    expect(html).toContain('red')
    expect(html).toContain('styled')
  })

  it('ignores event handlers in HTML output', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('button', { onclick: () => {} }, 'Click me')
      }
    })
    expect(html).toContain('Click me')
    expect(html).not.toContain('onclick')
    expect(html).not.toContain('function')
  })

  it('renders array children', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const items = ['one', 'two', 'three']
        return h('ul', items.map(item => h('li', item)))
      }
    })
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('<li>two</li>')
    expect(html).toContain('<li>three</li>')
  })

  it('isolates state between renders', async () => {
    const result1 = await renderToString({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const val = registeredState('shared', 'first')
        return h('div', val())
      }
    })

    const result2 = await renderToString({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const val = registeredState('shared', 'second')
        return h('div', val())
      }
    })

    expect(result1.state.shared).toBe('first')
    expect(result2.state.shared).toBe('second')
  })
})
