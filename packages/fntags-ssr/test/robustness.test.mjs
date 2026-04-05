import { describe, it, expect, beforeEach } from 'vitest'
import { renderToString } from '../src/index.mjs'

describe('renderToString robustness', () => {
  beforeEach(() => {
    globalThis.__fntags_registry = undefined
  })

  it('handles sync appFn (not async)', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        // Return a sync result, no awaiting inside the component
        return h('div', 'sync app')
      }
    })
    expect(html).toContain('sync app')
  })

  it('renders SVG elements', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const { svg, circle, rect } = await import('@srfnstack/fntags/svgelements')
        return h('div',
          svg({ width: '100', height: '100' },
            circle({ cx: '50', cy: '50', r: '40', fill: 'red' }),
            rect({ x: '10', y: '10', width: '30', height: '30', fill: 'blue' })
          )
        )
      }
    })
    expect(html).toContain('<svg')
    expect(html).toContain('<circle')
    expect(html).toContain('<rect')
    expect(html).toContain('fill="red"')
  })

  it('handles falsy state values correctly', async () => {
    const { state } = await renderToString({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const zero = registeredState('zero', 0)
        const empty = registeredState('empty', '')
        const no = registeredState('no', false)
        const nil = registeredState('nil', null)
        return h('div',
          h('span', String(zero())),
          h('span', String(empty())),
          h('span', String(no())),
          h('span', String(nil()))
        )
      }
    })
    expect(state.zero).toBe(0)
    expect(state.empty).toBe('')
    expect(state.no).toBe(false)
    expect(state.nil).toBe(null)
  })

  it('handles deeply nested component tree', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        // 10 levels deep
        let tree = h('span', 'leaf')
        for (let i = 0; i < 10; i++) {
          tree = h('div', { class: `level-${i}` }, tree)
        }
        return tree
      }
    })
    expect(html).toContain('leaf')
    expect(html).toContain('level-0')
    expect(html).toContain('level-9')
  })

  it('handles large lists', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const items = Array.from({ length: 500 }, (_, i) => h('li', `item-${i}`))
        return h('ul', items)
      }
    })
    expect(html).toContain('item-0')
    expect(html).toContain('item-499')
  })

  it('handles multiple promise children', async () => {
    const { html } = await renderToString({
      url: '/',
      timeout: 3000,
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const p1 = new Promise(resolve =>
          setTimeout(() => resolve(h('span', 'async-1')), 20)
        )
        const p2 = new Promise(resolve =>
          setTimeout(() => resolve(h('span', 'async-2')), 40)
        )
        const p3 = new Promise(resolve =>
          setTimeout(() => resolve(h('span', 'async-3')), 60)
        )
        return h('div', p1, p2, p3)
      }
    })
    expect(html).toContain('async-1')
    expect(html).toContain('async-2')
    expect(html).toContain('async-3')
    expect(html).not.toContain('fntags-promise-marker')
  })

  it('concurrent renderToString calls produce isolated results', async () => {
    // Launch multiple renders concurrently — they should queue via mutex
    const renders = await Promise.all([
      renderToString({
        url: '/',
        async appFn () {
          const { h, registeredState } = await import('@srfnstack/fntags')
          const val = registeredState('key', 'render-A')
          return h('div', val())
        }
      }),
      renderToString({
        url: '/',
        async appFn () {
          const { h, registeredState } = await import('@srfnstack/fntags')
          const val = registeredState('key', 'render-B')
          return h('div', val())
        }
      }),
      renderToString({
        url: '/',
        async appFn () {
          const { h, registeredState } = await import('@srfnstack/fntags')
          const val = registeredState('key', 'render-C')
          return h('div', val())
        }
      })
    ])

    expect(renders[0].html).toContain('render-A')
    expect(renders[0].state.key).toBe('render-A')
    expect(renders[1].html).toContain('render-B')
    expect(renders[1].state.key).toBe('render-B')
    expect(renders[2].html).toContain('render-C')
    expect(renders[2].state.key).toBe('render-C')
  })

  it('globals are restored even after error', async () => {
    const origDoc = globalThis.document
    const origWin = globalThis.window

    try {
      await renderToString({
        url: '/',
        appFn () { throw new Error('boom') }
      })
    } catch (e) {
      // expected
    }

    // Globals should be restored to whatever they were before
    // (in vitest they may be undefined since no happy-dom env for this file)
    expect(globalThis.document).toBe(origDoc)
    expect(globalThis.window).toBe(origWin)
  })

  it('state registry is restored even after error', async () => {
    const sentinel = new Map()
    sentinel.set('test', 'preserved')
    globalThis.__fntags_registry = sentinel

    try {
      await renderToString({
        url: '/',
        appFn () { throw new Error('boom') }
      })
    } catch (e) {
      // expected
    }

    expect(globalThis.__fntags_registry).toBe(sentinel)
    expect(globalThis.__fntags_registry.get('test')).toBe('preserved')
  })

  it('handles boolean attributes', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div',
          h('input', { type: 'checkbox', checked: true }),
          h('button', { disabled: true }, 'Disabled'),
          h('select',
            h('option', { value: 'a', selected: true }, 'A'),
            h('option', { value: 'b' }, 'B')
          )
        )
      }
    })
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('Disabled')
  })

  it('handles empty children gracefully', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div',
          h('p'),
          h('ul'),
          h('span', '')
        )
      }
    })
    expect(html).toContain('<p>')
    expect(html).toContain('<ul>')
  })

  it('handles special characters in content', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div',
          h('p', 'Tom & Jerry'),
          h('p', '2 < 3 > 1'),
          h('p', '"quoted"')
        )
      }
    })
    expect(html).toContain('Tom')
    expect(html).toContain('Jerry')
  })

  it('does not accumulate route observers across renders', async () => {
    const renderWithRouting = () => renderToString({
      url: '/test',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const { route, routeSwitch } = await import('@srfnstack/fntags/fnroute')
        return h('div',
          routeSwitch(
            route({ path: '/test' }, h('p', 'routed'))
          )
        )
      }
    })

    // First render establishes baseline (module-level observers from import)
    await renderWithRouting()

    const { pathState, pathParameters } = await import('@srfnstack/fntags/fnroute')
    const baselinePathObservers = pathState._ctx ? pathState._ctx.observers.length : 0
    const baselineParamObservers = pathParameters._ctx ? pathParameters._ctx.observers.length : 0

    // Render 5 more times
    for (let i = 0; i < 5; i++) {
      await renderWithRouting()
    }

    // Observer arrays should not have grown beyond the baseline
    const finalPathObservers = pathState._ctx ? pathState._ctx.observers.length : 0
    const finalParamObservers = pathParameters._ctx ? pathParameters._ctx.observers.length : 0

    expect(finalPathObservers).toBe(baselinePathObservers)
    expect(finalParamObservers).toBe(baselineParamObservers)
  })

  it('handles state with undefined values in objects', async () => {
    const { state } = await renderToString({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        // Note: JSON.stringify strips undefined values from objects
        const data = registeredState('data', { a: 1, b: undefined, c: 'three' })
        return h('div', JSON.stringify(data()))
      }
    })
    expect(state.data.a).toBe(1)
    expect(state.data.c).toBe('three')
    // The raw state snapshot preserves the undefined key.
    // It gets dropped when the consumer calls JSON.stringify(state) for embedding.
    expect('b' in state.data).toBe(true)
    expect(state.data.b).toBeUndefined()
  })

  it('does not fetch external resources during render', async () => {
    // Start a timer — if happy-dom tried to fetch these URLs, the render
    // would either hang waiting for a connection or take noticeably longer.
    // More importantly, we verify the elements serialize correctly without loading.
    const start = Date.now()
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div',
          // These would trigger real HTTP requests if resource loading were enabled
          h('script', { src: 'http://198.51.100.1:9999/slow.js' }),
          h('link', { rel: 'stylesheet', href: 'http://198.51.100.1:9999/slow.css' }),
          h('iframe', { src: 'http://198.51.100.1:9999/page.html' }),
          h('p', 'rendered')
        )
      }
    })
    const elapsed = Date.now() - start

    // The render should complete almost instantly (no network wait)
    // 198.51.100.1 is TEST-NET-2 (RFC 5737) — guaranteed unroutable, so any
    // real connection attempt would hang until timeout, not complete in < 2s.
    expect(elapsed).toBeLessThan(2000)
    expect(html).toContain('rendered')
    // The elements should be present in the serialized HTML
    expect(html).toContain('slow.js')
    expect(html).toContain('slow.css')
  })
})
