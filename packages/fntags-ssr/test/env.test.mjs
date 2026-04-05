import { describe, it, expect } from 'vitest'
import { setupEnv, acquireMutex } from '../src/ssr-env.mjs'

describe('setupEnv', () => {
  it('installs document and window on globalThis', () => {
    const origDoc = globalThis.document
    const origWin = globalThis.window

    const { cleanup } = setupEnv('http://example.com/test')

    try {
      expect(globalThis.document).toBeDefined()
      expect(globalThis.window).toBeDefined()
      // The installed document should come from happy-dom, not the original
      expect(globalThis.document).not.toBe(origDoc)
    } finally {
      cleanup()
    }
  })

  it('sets the correct URL on the environment', () => {
    const { cleanup } = setupEnv('http://example.com/my-page')

    try {
      expect(globalThis.location.pathname).toBe('/my-page')
      expect(globalThis.location.origin).toBe('http://example.com')
    } finally {
      cleanup()
    }
  })

  it('restores original globals after cleanup', () => {
    const origDoc = globalThis.document
    const origWin = globalThis.window

    const { cleanup } = setupEnv('http://localhost/')
    cleanup()

    expect(globalThis.document).toBe(origDoc)
    expect(globalThis.window).toBe(origWin)
  })

  it('installs DOM constructors', () => {
    const { cleanup } = setupEnv('http://localhost/')

    try {
      expect(globalThis.HTMLElement).toBeDefined()
      expect(globalThis.Node).toBeDefined()
      expect(globalThis.Element).toBeDefined()
    } finally {
      cleanup()
    }
  })

  it('cleans up constructors that were not previously defined', () => {
    // Remove a constructor if it exists, to test the delete path
    const hadHTMLCollection = 'HTMLCollection' in globalThis
    const origHTMLCollection = globalThis.HTMLCollection

    if (hadHTMLCollection) {
      // Can't easily test this path since vitest may define it,
      // so just verify cleanup doesn't throw
      const { cleanup } = setupEnv('http://localhost/')
      cleanup()
    } else {
      const { cleanup } = setupEnv('http://localhost/')
      expect(globalThis.HTMLCollection).toBeDefined()
      cleanup()
      expect('HTMLCollection' in globalThis).toBe(false)
    }
  })

  it('disables resource loading to prevent SSRF', () => {
    const { cleanup, window: win } = setupEnv('http://localhost/')

    try {
      const settings = win.happyDOM.settings
      expect(settings.disableJavaScriptFileLoading).toBe(true)
      expect(settings.disableCSSFileLoading).toBe(true)
      expect(settings.disableIframePageLoading).toBe(true)
      expect(settings.handleDisabledFileLoadingAsSuccess).toBe(true)
      expect(settings.navigation.disableMainFrameNavigation).toBe(true)
      expect(settings.navigation.disableChildFrameNavigation).toBe(true)
      expect(settings.navigation.disableChildPageNavigation).toBe(true)
    } finally {
      cleanup()
    }
  })

  it('calls Window.close on cleanup', () => {
    let closeCalled = false
    const { cleanup, window: win } = setupEnv('http://localhost/')

    // Monkey-patch close to detect the call
    const origClose = win.close.bind(win)
    win.close = () => {
      closeCalled = true
      origClose()
    }

    cleanup()
    expect(closeCalled).toBe(true)
  })
})

describe('acquireMutex', () => {
  it('returns a release function', async () => {
    const release = await acquireMutex()
    expect(typeof release).toBe('function')
    release()
  })

  it('releases mutex even when render throws during setup', async () => {
    const { renderToString } = await import('../src/index.mjs')

    // First render: throw immediately in appFn
    await expect(renderToString({
      url: '/',
      appFn () { throw new Error('setup boom') }
    })).rejects.toThrow('setup boom')

    // Second render must complete within a reasonable time (not deadlocked)
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Deadlocked — mutex was not released')), 3000)
    )
    const render = renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'not deadlocked')
      }
    })

    const { html } = await Promise.race([render, timeout])
    expect(html).toContain('not deadlocked')
  })

  it('releases mutex even when multiple errors occur in sequence', async () => {
    const { renderToString } = await import('../src/index.mjs')

    // Three consecutive errors
    for (let i = 0; i < 3; i++) {
      try {
        await renderToString({
          url: '/',
          appFn () { throw new Error(`error-${i}`) }
        })
      } catch (e) { /* expected */ }
    }

    // Should still be able to render
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        return h('div', 'recovered')
      }
    })
    expect(html).toContain('recovered')
  })

  it('serializes concurrent access', async () => {
    const order = []

    const run = async (id) => {
      const release = await acquireMutex()
      order.push(`start-${id}`)
      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, 10))
      order.push(`end-${id}`)
      release()
    }

    // Launch two concurrent renders
    const p1 = run('a')
    const p2 = run('b')
    await Promise.all([p1, p2])

    // Second should not start until first finishes
    expect(order).toEqual(['start-a', 'end-a', 'start-b', 'end-b'])
  })
})
