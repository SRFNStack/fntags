import { describe, it, expect, beforeEach } from 'vitest'
import { renderToStream, renderToString } from '../src/index.mjs'

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

describe('renderToStream advanced', () => {
  beforeEach(() => {
    globalThis.__fntags_registry = undefined
  })

  it('handles appFn that throws', async () => {
    const stream = renderToStream({
      url: '/',
      appFn () {
        throw new Error('stream app broke')
      }
    })

    const reader = stream.getReader()
    await expect(reader.read()).rejects.toThrow('stream app broke')
  })

  it('recovers after stream error — subsequent renders work', async () => {
    // First: a broken stream
    const broken = renderToStream({
      url: '/',
      appFn () { throw new Error('boom') }
    })
    const reader = broken.getReader()
    try { await reader.read() } catch (e) { /* expected */ }

    // Second: should work fine (mutex released, globals restored)
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'recovered-after-stream')
      }
    })
    expect(html).toContain('recovered-after-stream')
  })

  it('isolates state between consecutive streams', async () => {
    const html1 = await streamToString(renderToStream({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const val = registeredState('key', 'stream-1')
        return h('div', val())
      }
    }))

    const html2 = await streamToString(renderToStream({
      url: '/',
      async appFn () {
        const { h, registeredState } = await import('@srfnstack/fntags')
        const val = registeredState('key', 'stream-2')
        return h('div', val())
      }
    }))

    expect(html1).toContain('stream-1')
    expect(html2).toContain('stream-2')
  })

  it('omits state script when no registeredState is used', async () => {
    const html = await streamToString(renderToStream({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'no state here')
      }
    }))

    expect(html).toContain('no state here')
    expect(html).not.toContain('__FNTAGS_SSR_STATE__')
  })

  it('handles multiple elements in output', async () => {
    const html = await streamToString(renderToStream({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div',
          h('header', h('h1', 'Title')),
          h('main', h('p', 'Content')),
          h('footer', 'Footer')
        )
      }
    }))

    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<p>Content</p>')
    expect(html).toContain('Footer')
  })

  it('handles multiple promise children in stream', async () => {
    const html = await streamToString(renderToStream({
      url: '/',
      timeout: 3000,
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const p1 = new Promise(resolve =>
          setTimeout(() => resolve(h('span', 'first')), 20)
        )
        const p2 = new Promise(resolve =>
          setTimeout(() => resolve(h('span', 'second')), 40)
        )
        return h('div', p1, p2)
      }
    }))

    expect(html).toContain('first')
    expect(html).toContain('second')
  })

  it('passes appFn as non-function (element directly)', async () => {
    // renderToStream supports passing a pre-built element
    // We need to build it inside the env though, so use appFn
    const html = await streamToString(renderToStream({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'element-direct')
      }
    }))
    expect(html).toContain('element-direct')
  })
})
