import { describe, it, expect, vi, afterEach } from 'vitest'
import { h, fntemplate, delegateEvents, setDevMode } from '@srfnstack/fntags'

// Delegation is module-global and cannot be undone, so this file has its own
// module instance (vitest isolates test files) and every test can assume the
// types delegated by earlier tests stay delegated.

const tplBefore = fntemplate(ctx => h('button', { onclick: ctx('click') }))

delegateEvents(['click', 'input'])

const mount = el => {
  document.body.append(el)
  return el
}

afterEach(() => {
  document.body.textContent = ''
})

describe('delegateEvents', () => {
  it('stores delegated handlers as an expando instead of a listener', () => {
    const fn = () => {}
    const el = h('button', { onclick: fn })
    expect(el.__fnon_click).toBe(fn)
  })

  it('delegated click reaches the handler with this and currentTarget set to the element', () => {
    let self, current, target
    const inner = h('span', 'x')
    const btn = mount(h('button', {
      onclick (e) {
        self = this
        current = e.currentTarget
        target = e.target
      }
    }, inner))
    const ev = new MouseEvent('click', { bubbles: true })
    inner.dispatchEvent(ev)
    expect(self).toBe(btn)
    expect(current).toBe(btn)
    expect(target).toBe(inner)
    // currentTarget is restored once dispatch is over
    expect(Object.prototype.hasOwnProperty.call(ev, 'currentTarget')).toBe(false)
  })

  it('runs handlers innermost first', () => {
    const calls = []
    const inner = h('span', { onclick: () => calls.push('inner') })
    mount(h('div', { onclick: () => calls.push('outer') }, inner))
    inner.click()
    expect(calls).toEqual(['inner', 'outer'])
  })

  it('stopPropagation in an inner handler stops outer delegated handlers', () => {
    const outer = vi.fn()
    const inner = h('span', { onclick: e => e.stopPropagation() })
    mount(h('div', { onclick: outer }, inner))
    inner.click()
    expect(outer).not.toHaveBeenCalled()
  })

  it('leaves non-delegated types on addEventListener', () => {
    const fn = vi.fn()
    const el = mount(h('input', { onkeydown: fn }))
    expect(el.__fnon_keydown).toBeUndefined()
    el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: false }))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not delegate non-bubbling types and warns in dev mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      setDevMode(true)
      delegateEvents(['focus', 'mouseenter'])
      expect(warn).toHaveBeenCalledTimes(2)
    } finally {
      warn.mockRestore()
    }
    const fn = vi.fn()
    const el = mount(h('input', { onfocus: fn }))
    expect(el.__fnon_focus).toBeUndefined()
    el.dispatchEvent(new FocusEvent('focus'))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('calls array handlers as fn.call(element, arg, event)', () => {
    const fn = vi.fn(function (arg, e) { return this })
    const el = mount(h('button', { onclick: [fn, 42] }))
    el.click()
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn.mock.calls[0][0]).toBe(42)
    expect(fn.mock.calls[0][1].type).toBe('click')
    expect(fn.mock.results[0].value).toBe(el)
  })

  it('supports array handlers for non-delegated types', () => {
    const fn = vi.fn(function (arg, e) { return this })
    const el = mount(h('input', { onchange: [fn, 'a'] }))
    el.dispatchEvent(new Event('change'))
    expect(fn.mock.calls[0][0]).toBe('a')
    expect(fn.mock.calls[0][1].type).toBe('change')
    expect(fn.mock.results[0].value).toBe(el)
  })

  it('keeps walking the original path when a handler removes its element', () => {
    const outer = vi.fn()
    const inner = h('span', { onclick () { this.remove() } })
    const wrap = mount(h('div', { onclick: outer }, inner))
    inner.click()
    expect(wrap.contains(inner)).toBe(false)
    expect(outer).toHaveBeenCalledTimes(1)
  })

  it('does not run handlers on detached elements', () => {
    const fn = vi.fn()
    const el = h('button', { onclick: fn })
    el.click()
    expect(fn).not.toHaveBeenCalled()
  })

  it('stopPropagation in a native listener prevents delegated handlers', () => {
    const delegated = vi.fn()
    const inner = h('span')
    inner.addEventListener('click', e => e.stopPropagation())
    mount(h('div', { onclick: delegated }, inner))
    inner.click()
    expect(delegated).not.toHaveBeenCalled()
  })

  it('delegates fntemplate event bindings compiled after the call', () => {
    const tpl = fntemplate(ctx => h('tr', { onclick: ctx('row') }, h('td', h('a', { onclick: ctx('remove') }, 'x'))))
    const calls = []
    const row = vi.fn(() => calls.push('row'))
    const remove = e => {
      calls.push('remove')
      e.stopPropagation()
    }
    const tr = mount(tpl({ row, remove }))
    const a = tr.querySelector('a')
    expect(tr.__fnon_click).toBe(row)
    expect(a.__fnon_click).toBe(remove)
    a.click()
    expect(calls).toEqual(['remove'])
    tr.querySelector('td').click()
    expect(calls).toEqual(['remove', 'row'])
  })

  it('accepts array handlers in fntemplate', () => {
    const tpl = fntemplate(ctx => h('button', { onclick: ctx('click') }))
    const fn = vi.fn()
    const el = mount(tpl({ click: [fn, 7] }))
    el.click()
    expect(fn.mock.calls[0][0]).toBe(7)
  })

  it('keeps addEventListener for templates compiled before the call', () => {
    const fn = vi.fn()
    const el = mount(tplBefore({ click: fn }))
    expect(el.__fnon_click).toBeUndefined()
    el.click()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('delegates input events too', () => {
    const fn = vi.fn()
    const el = mount(h('div', h('input', { oninput: fn })))
    el.firstChild.dispatchEvent(new Event('input', { bubbles: true }))
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
