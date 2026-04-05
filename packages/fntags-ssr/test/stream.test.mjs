import { describe, it, expect, beforeEach } from 'vitest'
import { renderToStream } from '../src/index.mjs'

/**
 * Helper to consume a ReadableStream into a single string.
 */
async function streamToString (stream) {
  const reader = stream.getReader()
  let result = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += value
  }
  return result
}

describe('renderToStream', () => {
  beforeEach(() => {
    globalThis.__fntags_registry = undefined
  })

  it('streams basic HTML', async () => {
    const stream = renderToStream({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', h('p', 'hello stream'))
      }
    })
    const html = await streamToString(stream)
    expect(html).toContain('<p>hello stream</p>')
  })

  it('includes state script in output', async () => {
    const stream = renderToStream({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const count = registeredState('count', 7)
        return h('div', String(count()))
      }
    })
    const html = await streamToString(stream)
    expect(html).toContain('7')
    expect(html).toContain('__FNTAGS_SSR_STATE__')
    expect(html).toContain('count')
  })

  it('streams routing content for the correct URL', async () => {
    const stream = renderToStream({
      url: '/about',
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
    const html = await streamToString(stream)
    expect(html).toContain('About')
    expect(html).not.toContain('>Home<')
  })

  it('returns a ReadableStream', () => {
    const stream = renderToStream({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'test')
      }
    })
    expect(stream).toBeInstanceOf(ReadableStream)
  })

  it('resolves promise children in streamed output', async () => {
    const stream = renderToStream({
      url: '/',
      timeout: 3000,
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const asyncChild = new Promise(resolve => {
          setTimeout(() => resolve(h('span', 'async-loaded')), 50)
        })
        return h('div', h('p', 'sync-content'), asyncChild)
      }
    })
    const html = await streamToString(stream)
    // The initial flush has the placeholder, but the replacement script has the resolved content
    expect(html).toContain('sync-content')
    expect(html).toContain('async-loaded')
  })

  it('does not wrap output in shell div when there are no promises', async () => {
    const stream = renderToStream({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'no promises')
      }
    })
    const html = await streamToString(stream)
    expect(html).not.toContain('fntags-ssr-shell')
    expect(html).toContain('no promises')
  })
})
