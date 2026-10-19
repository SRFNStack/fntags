import { describe, it, expect } from 'vitest'
import { h, fnstate, renderNode } from '@srfnstack/fntags'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('array rendering', () => {
  it('renderNode flattens an array into a DocumentFragment', () => {
    const frag = renderNode([h('span', 'a'), 'b', [h('i', 'c'), [h('b', 'd')]]])
    expect(frag.nodeType).toBe(11)
    const el = h('div', frag)
    expect(el.innerHTML).toBe('<span>a</span>b<i>c</i><b>d</b>')
  })

  it('h renders nested arrays of children at any depth', () => {
    const el = h('div', [h('span', 'a'), [h('span', 'b'), [[h('span', 'c')]]]])
    expect(el.querySelectorAll('span').length).toBe(3)
    expect(el.textContent).toBe('abc')
  })

  it('renders a promise that resolves to an array', async () => {
    const el = h('div', Promise.resolve([h('span', 'a'), h('span', 'b')]))
    await flush()
    expect(el.innerHTML).toBe('<span>a</span><span>b</span>')
  })

  it('renders an anchor whose promise child resolves to an array', async () => {
    const a = h('a', { href: '/x' }, Promise.resolve(['text ', h('b', 'bold')]))
    await flush()
    expect(a.innerHTML).toBe('text <b>bold</b>')
  })

  it('renders a function that returns an array', () => {
    const el = h('div', () => [h('span', 'a'), h('span', 'b')])
    expect(el.querySelectorAll('span').length).toBe(2)
  })

  it('throws a clear error when a bindAs function returns an array', () => {
    const state = fnstate(1)
    expect(() => h('div', state.bindAs(() => [h('span'), h('span')]))).toThrow(/single node/)
  })

  it('throws a clear error when a bindChildren function returns an array', () => {
    const state = fnstate([{ id: 1 }], i => i.id)
    expect(() => state.bindChildren(h('div'), () => [h('span'), h('span')])).toThrow(/single node/)
  })
})
