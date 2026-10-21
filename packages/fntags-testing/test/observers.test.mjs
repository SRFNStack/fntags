import { describe, it, expect } from 'vitest'
import { fnstate, h } from '@srfnstack/fntags'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('state function read and write forms', () => {
  it('state() reads, state(undefined) writes undefined and notifies', () => {
    const s = fnstate('a')
    const calls = []
    s.subscribe((n, o) => calls.push([n, o]))
    expect(s()).toBe('a')
    s(undefined)
    expect(s()).toBe(undefined)
    expect(calls).toEqual([[undefined, 'a']])
  })

  it('state(state) returns the current value without notifying', () => {
    const s = fnstate('a')
    let calls = 0
    s.subscribe(() => calls++)
    expect(s(s)).toBe('a')
    expect(calls).toBe(0)
  })

  it('shares one method table and keeps parentCtx on the context', () => {
    const a = fnstate(1)
    const b = fnstate(2)
    expect(a.isFnState).toBe(true)
    expect(a.bindAs).toBe(b.bindAs)
    expect(Object.keys(a)).toEqual(['_ctx'])
    const parent = fnstate([], x => x)
    a.parentCtx = parent._ctx
    expect(a.parentCtx).toBe(parent._ctx)
    expect(a._ctx.parentCtx).toBe(parent._ctx)
    expect(Object.keys(a)).toEqual(['_ctx'])
  })

  it('setting the same value still notifies, as before', () => {
    const s = fnstate('a')
    let calls = 0
    s.subscribe(() => calls++)
    s('a')
    expect(calls).toBe(1)
  })
})

describe('observer list changes while notifying', () => {
  it('a nested write inside a subscriber notifies the current list and the outer loop finishes', () => {
    const s = fnstate(0)
    const calls = []
    let unsubThird
    s.subscribe((n) => {
      calls.push('first:' + n)
      if (n === 1) {
        unsubThird()
        s(2)
      }
    })
    s.subscribe((n) => calls.push('second:' + n))
    unsubThird = s.subscribe((n) => calls.push('third:' + n))

    s(1)
    // The nested write runs against the list without the third observer, then
    // the outer loop resumes over its own (unchanged) list.
    expect(calls).toEqual(['first:1', 'first:2', 'second:2', 'second:1', 'third:1'])
    expect(s._ctx.observers.length).toBe(2)
    expect(s._ctx.notifying).toBe(0)
  })

  it('an observer that throws does not leave the state stuck in notifying mode', () => {
    const s = fnstate(0)
    s.subscribe(() => { throw new Error('boom') })
    expect(() => s(1)).toThrow('boom')
    expect(s._ctx.notifying).toBe(0)
    const unsub = s.subscribe(() => {})
    expect(s._ctx.observers.length).toBe(2)
    unsub()
    expect(s._ctx.observers.length).toBe(1)
  })

  it('unsubscribing the same callback twice only removes one registration', () => {
    const s = fnstate(0)
    const cb = () => {}
    const unsub1 = s.subscribe(cb)
    s.subscribe(cb)
    expect(s._ctx.observers.length).toBe(2)
    unsub1()
    unsub1()
    expect(s._ctx.observers.length).toBe(1)
  })

  it('a state with no subscribers has an empty observer list that is never shared by mutation', () => {
    const a = fnstate(0)
    const b = fnstate(0)
    expect(a._ctx.observers.length).toBe(0)
    expect(a._ctx.observers).toBe(b._ctx.observers)
    a.subscribe(() => {})
    expect(a._ctx.observers.length).toBe(1)
    expect(b._ctx.observers.length).toBe(0)
  })
})

describe('bound attribute and style value functions', () => {
  it('bindAttr() with no function does not notify the state while the element is created', () => {
    const s = fnstate('red')
    let calls = 0
    s.subscribe(() => calls++)
    const el = h('div', { class: s.bindAttr() })
    expect(el.className).toBe('red')
    expect(calls).toBe(0)
    s('blue')
    expect(el.className).toBe('blue')
    expect(calls).toBe(1)
  })

  it('bindAttr receives the value initially and (newValue, oldValue) on change', () => {
    const s = fnstate('a')
    const seen = []
    const el = h('div', { title: s.bindAttr((n, o) => { seen.push([n, o]); return n + '!' }) })
    expect(el.getAttribute('title')).toBe('a!')
    s('b')
    expect(el.getAttribute('title')).toBe('b!')
    expect(seen).toEqual([['a', undefined], ['b', 'a']])
  })

  it('bindStyle with a function receives the state value', () => {
    const s = fnstate(10)
    const el = h('div', { style: { width: s.bindStyle(v => v + 'px') } })
    expect(el.style.width).toBe('10px')
    s(20)
    expect(el.style.width).toBe('20px')
  })

  it('bindSelectAttr registers its observer lazily on the parent and removes it with the item', () => {
    const items = fnstate([{ id: 1 }, { id: 2 }], o => o.id)
    expect(Object.keys(items._ctx.selectObservers).length).toBe(0)
    const container = h('div')
    items.bindChildren(container, item =>
      h('span', { class: item.bindSelectAttr(key => key === item().id ? 'sel' : '') })
    )
    expect(Object.keys(items._ctx.selectObservers)).toEqual(['1', '2'])
    items.select(2)
    expect(container.children[1].className).toBe('sel')
    expect(container.children[0].className).toBe('')
    items([{ id: 2 }])
    expect(Object.keys(items._ctx.selectObservers)).toEqual(['2'])
    items([])
    expect(Object.keys(items._ctx.selectObservers).length).toBe(0)
  })

  it('several select observers on one key notify and unregister independently', async () => {
    const items = fnstate([{ id: 1 }, { id: 2 }], o => o.id)
    const toggle = fnstate(true)
    const container = h('div')
    items.bindChildren(container, item =>
      h('p',
        { class: item.bindSelectAttr(key => key === item().id ? 'sel' : '') },
        item.bindSelect(() => items.selected() === item().id ? 'yes' : 'no'),
        toggle.bindAs(on => on ? h('b', { title: item.bindSelectAttr(key => key === item().id ? 't' : '') }) : h('i'))
      )
    )
    items.select(1)
    await flush()
    const first = container.children[0]
    expect(first.className).toBe('sel')
    expect(first.textContent).toBe('yes')
    expect(first.querySelector('b').getAttribute('title')).toBe('t')
    // the inner bindAs re-render removes its own select observer and keeps the others
    toggle(false)
    await flush()
    expect(first.querySelector('i')).not.toBeNull()
    items.select(2)
    await flush()
    expect(first.hasAttribute('class')).toBe(false)
    expect(first.textContent).toBe('no')
    expect(container.children[1].className).toBe('sel')
    expect(container.children[1].textContent).toBe('yes')
    items([])
    expect(Object.keys(items._ctx.selectObservers).length).toBe(0)
  })

  it('cleanup lists hold the bindings themselves, not closures', () => {
    const outer = fnstate('a')
    const inner = fnstate('x')
    const nested = outer.bindAs(() => h('span', { class: inner.bindAttr() }, inner.bindAs()))
    const cleanups = nested.elCtx.cleanups
    expect(cleanups.length).toBe(2)
    expect(cleanups.every(c => typeof c === 'object' && typeof c.dispose === 'function')).toBe(true)
  })
})

describe('batched bindAs replacement', () => {
  it('replacements queued in one synchronous run all apply after one microtask, in order', async () => {
    const a = fnstate('a1')
    const b = fnstate('b1')
    const el = h('div', a.bindAs(v => h('span', v)), b.bindAs(v => h('span', v)))
    a('a2')
    b('b2')
    expect(el.textContent).toBe('a1b1')
    await Promise.resolve()
    expect(el.textContent).toBe('a2b2')
  })

  it('several writes before the microtask leave the last render in the DOM', async () => {
    const s = fnstate(1)
    const el = h('div', s.bindAs(v => h('span', String(v))))
    s(2)
    s(3)
    s(4)
    await flush()
    expect(el.textContent).toBe('4')
    expect(el.childNodes.length).toBe(1)
    s(5)
    await flush()
    expect(el.textContent).toBe('5')
  })

  it('a bindAs render that registers nothing holds no cleanup list, one that does holds it', async () => {
    const outer = fnstate('a')
    const inner = fnstate('x')
    const plain = outer.bindAs(v => h('span', v))
    expect(plain.elCtx.cleanups).toBeNull()
    const nested = outer.bindAs(v => h('span', { class: inner.bindAttr() }, v))
    expect(nested.elCtx.cleanups.length).toBe(1)
    h('div', plain, nested)
    outer('b')
    await flush()
    expect(plain.elCtx.cleanups).toBeNull()
    expect(nested.elCtx.cleanups.length).toBe(1)
    expect(inner._ctx.observers.length).toBe(1)
  })
})
