import { describe, it, expect, vi } from 'vitest'
import { h } from '@srfnstack/fntags'
import { goTo, pathState, listenFor, afterRouteChange, scrollToHash } from '@srfnstack/fntags/fnroute'

const flush = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

describe('hash-only navigation', () => {
  it('goTo to the current path with a hash does not change pathState or emit route events', async () => {
    goTo('/hashpage')
    await flush()
    expect(pathState().currentPath).toBe('/hashpage')

    const subscriber = vi.fn()
    const unsub = pathState.subscribe(subscriber)
    const listener = vi.fn()
    const stop = listenFor(afterRouteChange, listener)

    goTo('/hashpage#section')
    await flush()

    expect(window.location.hash).toBe('#section')
    expect(subscriber).not.toHaveBeenCalled()
    expect(listener).not.toHaveBeenCalled()
    unsub()
    stop()
  })

  it('goTo to the current path with a new context still triggers a route change', async () => {
    goTo('/ctxpage')
    await flush()
    const subscriber = vi.fn()
    const unsub = pathState.subscribe(subscriber)

    goTo('/ctxpage', { refreshed: true })
    await flush()

    expect(subscriber).toHaveBeenCalledTimes(1)
    expect(pathState().context).toEqual({ refreshed: true })
    unsub()
  })

  it('popstate without a path change does not change pathState', async () => {
    goTo('/poppage')
    await flush()
    const subscriber = vi.fn()
    const unsub = pathState.subscribe(subscriber)

    // Simulate the browser handling an <a href="#faq"> click: the url gains a hash and popstate fires
    history.pushState({}, '', window.location.pathname + '#faq')
    window.dispatchEvent(new PopStateEvent('popstate'))
    await flush()

    expect(subscriber).not.toHaveBeenCalled()
    expect(pathState().currentPath).toBe('/poppage')
    unsub()
  })

  it('popstate with a path change still updates pathState', async () => {
    goTo('/first')
    await flush()
    history.pushState({}, '', '/second')
    window.dispatchEvent(new PopStateEvent('popstate'))
    await flush()
    expect(pathState().currentPath).toBe('/second')
  })
})

describe('scrollToHash', () => {
  it('scrolls immediately when the target exists', () => {
    const target = h('div', { id: 'present' })
    target.scrollIntoView = vi.fn()
    document.body.append(target)
    scrollToHash('#present')
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1)
    target.remove()
  })

  it('waits for a target that is rendered later', async () => {
    const target = h('div', { id: 'later' })
    target.scrollIntoView = vi.fn()
    scrollToHash('later')
    expect(target.scrollIntoView).not.toHaveBeenCalled()

    document.body.append(target)
    await flush()
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1)

    // observer is disconnected after scrolling, further mutations do not scroll again
    document.body.append(h('div'))
    await flush()
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1)
    target.remove()
  })

  it('gives up after the timeout', async () => {
    const target = h('div', { id: 'toolate' })
    target.scrollIntoView = vi.fn()
    scrollToHash('toolate', 10)
    await flush(30)
    document.body.append(target)
    await flush()
    expect(target.scrollIntoView).not.toHaveBeenCalled()
    target.remove()
  })

  it('scrolls to the hash target once a lazily rendered route resolves', async () => {
    const target = h('div', { id: 'lazy-target' })
    target.scrollIntoView = vi.fn()
    let resolveRoute
    const container = h('div', new Promise(resolve => { resolveRoute = resolve }))
    document.body.append(container)

    goTo('/lazy#lazy-target')
    await flush()
    expect(target.scrollIntoView).not.toHaveBeenCalled()

    resolveRoute(target)
    await flush()
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1)
    container.remove()
  })
})
