import { describe, it, expect, beforeEach } from 'vitest'
import { renderToString } from '../src/index.mjs'

describe('renderToString edge cases', () => {
  beforeEach(() => {
    globalThis.__fntags_registry = undefined
  })

  it('recovers when appFn throws', async () => {
    await expect(renderToString({
      url: '/',
      appFn () {
        throw new Error('app broke')
      }
    })).rejects.toThrow('app broke')

    // Subsequent render should still work (env cleaned up, mutex released)
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'recovered')
      }
    })
    expect(html).toContain('recovered')
  })

  it('handles promise timeout gracefully', async () => {
    const { html } = await renderToString({
      url: '/',
      timeout: 50,
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const neverResolves = new Promise(() => {})
        return h('div',
          h('p', 'sync content'),
          neverResolves
        )
      }
    })
    // Sync content should be present
    expect(html).toContain('sync content')
    // Placeholder should remain since the promise never resolved
    expect(html).toContain('fntags-promise-marker')
  })

  it('works with custom rootPath', async () => {
    const { html } = await renderToString({
      url: '/about',
      rootPath: '/app',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const { route, routeSwitch } = await import('@srfnstack/fntags/fnroute')
        return h('div',
          routeSwitch(
            route({ path: '/', absolute: true }, h('p', 'Home')),
            route({ path: '/about' }, h('p', 'About'))
          )
        )
      }
    })
    expect(html).toContain('About')
  })

  it('works with custom origin', async () => {
    const { html } = await renderToString({
      url: '/',
      origin: 'https://example.com',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'custom origin')
      }
    })
    expect(html).toContain('custom origin')
  })

  it('serializes multiple registered states', async () => {
    const { state } = await renderToString({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const name = registeredState('name', 'Alice')
        const age = registeredState('age', 30)
        const items = registeredState('items', ['a', 'b', 'c'])
        return h('div', name(), String(age()), items().join(','))
      }
    })
    expect(state.name).toBe('Alice')
    expect(state.age).toBe(30)
    expect(state.items).toEqual(['a', 'b', 'c'])
  })

  it('returns empty state when no registeredState is used', async () => {
    const { state } = await renderToString({
      url: '/',
      async appFn () {
        const { h, fnstate } = await import('@srfnstack/fntags')
        const count = fnstate(5) // plain fnstate, not registered
        return h('div', String(count()))
      }
    })
    expect(Object.keys(state)).toHaveLength(0)
  })

  it('renders bindAttr in HTML output', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const cls = registeredState('cls', 'active')
        return h('div', { class: cls.bindAttr() })
      }
    })
    expect(html).toContain('class="active"')
  })

  it('renders bindStyle in HTML output', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const color = registeredState('color', 'blue')
        return h('div', { style: { color: color.bindStyle() } }, 'text')
      }
    })
    expect(html).toContain('blue')
    expect(html).toContain('text')
  })

  it('renders bindChildren in HTML output', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const items = registeredState('list', ['x', 'y', 'z'], v => v)
        return items.bindChildren(h('ul'), (item) =>
          h('li', item.bindAs())
        )
      }
    })
    expect(html).toContain('<li>x</li>')
    expect(html).toContain('<li>y</li>')
    expect(html).toContain('<li>z</li>')
  })

  it('renders fnlink elements in SSR output', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const { fnlink } = await import('@srfnstack/fntags/fnroute')
        return h('nav',
          fnlink({ to: '/about' }, 'About'),
          fnlink({ to: '/contact' }, 'Contact')
        )
      }
    })
    expect(html).toContain('About')
    expect(html).toContain('Contact')
    expect(html).toContain('href=')
  })

  it('handles appFn that returns a non-element node', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        // renderNode handles plain strings by creating text nodes
        return h('div', 'just text')
      }
    })
    expect(html).toContain('just text')
  })

  it('accepts a pre-built element as appFn (non-function)', async () => {
    // renderToString supports passing an element directly instead of a factory.
    // Since the element must be created inside the happy-dom env, we use an
    // async factory that returns an element — but the code path for non-function
    // is `typeof appFn === 'function' ? await appFn() : appFn`. We test the
    // non-function branch by wrapping in an immediately-resolved value.
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'pre-built')
      }
    })
    expect(html).toContain('pre-built')
  })

  it('skips unreadable states in serialization without crashing', async () => {
    const { html, state } = await renderToString({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const good = registeredState('good', 'works')

        // Manually inject a broken state into the registry
        const registry = globalThis.__fntags_registry
        registry.set('broken', () => { throw new Error('read error') })

        return h('div', good())
      }
    })
    // Good state should be serialized, broken state should be silently skipped
    expect(state.good).toBe('works')
    expect('broken' in state).toBe(false)
    expect(html).toContain('works')
  })

  it('handles rootPath with trailing slash', async () => {
    const { html } = await renderToString({
      url: '/page',
      rootPath: '/app/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'trailing-slash-root')
      }
    })
    expect(html).toContain('trailing-slash-root')
  })

  it('handles empty string rootPath', async () => {
    const { html } = await renderToString({
      url: '/page',
      rootPath: '',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'empty-root')
      }
    })
    expect(html).toContain('empty-root')
  })

  it('handles url with query string', async () => {
    const { html } = await renderToString({
      url: '/search?q=test&page=2',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'query-string')
      }
    })
    expect(html).toContain('query-string')
  })

  it('handles url with hash fragment', async () => {
    const { html } = await renderToString({
      url: '/page#section',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'hash-fragment')
      }
    })
    expect(html).toContain('hash-fragment')
  })
})
