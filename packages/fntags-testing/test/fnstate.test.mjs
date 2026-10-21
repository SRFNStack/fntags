import { describe, it, expect } from 'vitest'
import { fnstate, h } from '@srfnstack/fntags'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('fnstate', () => {
  it('should initialize with the given value', () => {
    const s = fnstate('initial')
    expect(s()).toBe('initial')
  })

  it('should update the value', () => {
    const s = fnstate('initial')
    s('new')
    expect(s()).toBe('new')
  })

  it('should notify subscribers', () => {
    const s = fnstate('initial')
    let notified = false
    s.subscribe((newVal, oldVal) => {
      expect(newVal).toBe('new')
      expect(oldVal).toBe('initial')
      notified = true
    })
    s('new')
    expect(notified).toBe(true)
  })

  describe('bindAs', () => {
    it('should bind to an element', async () => {
      const s = fnstate('initial')
      const el = h('div', s.bindAs(() => h('span', s())))
      expect(el.innerText).toBe('initial')
      s('new')
      await flush()
      expect(el.innerText).toBe('new')
    })

    it('should bind to an element without a function if the state is a node', async () => {
      const s = fnstate(h('div', 'initial'))
      const el = h('div', s.bindAs())
      expect(el.innerText).toBe('initial')
      s(h('div', 'new'))
      await flush()
      expect(el.innerText).toBe('new')
    })

    it('should not accumulate subscriptions when bindAttr is nested inside bindAs', async () => {
      const outer = fnstate('a')
      const inner = fnstate('red')
      const el = h('div', outer.bindAs(() => h('span', { class: inner.bindAttr() })))
      expect(inner._ctx.observers.length).toBe(1)
      outer('b')
      await flush()
      expect(inner._ctx.observers.length).toBe(1)
      outer('c')
      await flush()
      expect(inner._ctx.observers.length).toBe(1)
      // The surviving subscription still works
      inner('blue')
      expect(el.querySelector('span').className).toBe('blue')
    })

    it('should clean up nested bindAs subscriptions when parent re-renders', async () => {
      const outer = fnstate('a')
      const middle = fnstate('x')
      const inner = fnstate('1')
      h('div', outer.bindAs(() => middle.bindAs(() => h('span', { id: inner.bindAttr() }))))
      expect(inner._ctx.observers.length).toBe(1)
      expect(middle._ctx.observers.length).toBe(1)
      outer('b')
      await flush()
      expect(middle._ctx.observers.length).toBe(1)
      expect(inner._ctx.observers.length).toBe(1)
    })
  })

  describe('bindChildren', () => {
    it('should clean up subscriptions when items are removed from the array', () => {
      const items = fnstate([{ id: 1 }, { id: 2 }, { id: 3 }], o => o.id)
      const color = fnstate('red')
      const container = h('div')
      items.bindChildren(container, () => h('span', { class: color.bindAttr() }))
      expect(color._ctx.observers.length).toBe(3)

      items([{ id: 1 }, { id: 3 }])
      expect(color._ctx.observers.length).toBe(2)

      items([])
      expect(color._ctx.observers.length).toBe(0)
    })

    it('should clean up nested bindAs subscriptions when items are removed', async () => {
      const items = fnstate([{ id: 1 }, { id: 2 }], o => o.id)
      const inner = fnstate('x')
      const deep = fnstate('blue')
      const container = h('div')
      items.bindChildren(container, () =>
        inner.bindAs(val => h('span', { class: deep.bindAttr() }, val))
      )
      expect(inner._ctx.observers.length).toBe(2)
      expect(deep._ctx.observers.length).toBe(2)

      items([{ id: 1 }])
      await flush()
      expect(inner._ctx.observers.length).toBe(1)
      expect(deep._ctx.observers.length).toBe(1)
    })

    it('should bind array to children', () => {
      const s = fnstate(['a'])
      const el = h('div', s.bindChildren(h('div'), (child) => h('span', child())))
      expect(el.innerText).toBe('a')

      s(['c'])
      expect(el.innerText).toBe('c')

      s(['c', 'd'])
      expect(el.innerText).toBe('cd')
    })

    it('should handle reordering', () => {
      const s = fnstate([1, 2, 3])
      const container = h('div')
      s.bindChildren(container, (i) => h('div', i()))
      expect(container.innerText).toBe('123')
      s([3, 2, 1])
      expect(container.innerText).toBe('321')
    })

    it('should use mapKey', async () => {
      const s = fnstate([{ id: 1, val: 'a' }, { id: 2, val: 'b' }], (o) => o.id)
      const container = h('div')
      s.bindChildren(container, (item) => {
        const el = h('div', item.bindProp('val'))
        el.dataset.id = item().id
        return el
      })
      const firstEl = container.children[0]
      expect(firstEl.innerText).toBe('a')

      s([{ id: 1, val: 'aa' }, { id: 2, val: 'b' }])
      await flush()
      expect(container.children[0]).toBe(firstEl)
      expect(container.children[0].innerText).toBe('aa')
    })
  })

  describe('nested state', () => {
    it('should bind to nested properties', async () => {
      const s = fnstate({ user: { name: 'Alice', address: { city: 'Wonderland' } } })
      const el = h('div',
        h('span', { id: 'name' }, s.bindAs(st => st.user.name)),
        h('span', { id: 'city' }, s.bindAs(st => st.user.address.city))
      )

      expect(el.querySelector('#name').innerText).toBe('Alice')
      expect(el.querySelector('#city').innerText).toBe('Wonderland')

      s.assign({ user: { name: 'Bob', address: { city: 'Builderland' } } })
      await flush()

      expect(el.querySelector('#name').innerText).toBe('Bob')
      expect(el.querySelector('#city').innerText).toBe('Builderland')
    })
  })

  describe('bindProp', () => {
    it('should bind to a property', async () => {
      const s = fnstate({ foo: 'bar' })
      const el = h('div', s.bindProp('foo'))
      expect(el.innerText).toBe('bar')
      s({ foo: 'baz' })
      await flush()
      expect(el.innerText).toBe('baz')
    })
  })

  describe('bindAttr', () => {
    it('should bind to an attribute', () => {
      const s = fnstate('foo')
      const el = h('div', { class: s.bindAttr() })
      expect(el.className).toBe('foo')
      s('bar')
      expect(el.className).toBe('bar')
    })
  })

  describe('bindStyle', () => {
    it('should bind to a style', () => {
      const s = fnstate('red')
      const el = h('div', { style: { color: s.bindStyle() } })
      expect(el.style.color).toBe('red')
      s('blue')
      expect(el.style.color).toBe('blue')
    })
  })

  describe('selection', () => {
    it('should handle selection', () => {
      const s = fnstate([{ id: 0 }, { id: 1 }], (o) => o.id)
      const container = h('div')
      s.bindChildren(container, (item) => {
        return h('div', {
          class: item.bindSelectAttr((key) => key === item().id ? 'selected' : '')
        }, item.bindSelect(() => h('span', '*')))
      })

      expect(container.children[0].className).not.toContain('selected')

      s.select(0)
      expect(container.children[0].className).toContain('selected')
      expect(container.children[1].className).not.toContain('selected')

      s.select(1)
      expect(container.children[0].className).not.toContain('selected')
      expect(container.children[1].className).toContain('selected')
    })
  })

  describe('assign', () => {
    it('should assign properties to object state', () => {
      const s = fnstate({ a: 1, b: 2 })
      s.assign({ b: 3 })
      expect(s()).toEqual({ a: 1, b: 3 })
    })
  })

  describe('path', () => {
    it('should get path', () => {
      const s = fnstate({ a: { b: { c: 1 } } })
      expect(s.getPath('a.b.c')).toBe(1)
    })

    it('should set path', () => {
      const s = fnstate({ a: { b: { c: 1 } } })
      s.setPath('a.b.c', 2)
      expect(s().a.b.c).toBe(2)
    })

    it('should set path with fill', () => {
      const s = fnstate({})
      s.setPath('a.b.c', 2, true)
      expect(s().a.b.c).toBe(2)
    })
  })
})

describe('bindChildren reconciliation', () => {
  it('does not re-render an item whose reference did not change', async () => {
    const a = { id: 1, v: 'a' }
    const b = { id: 2, v: 'b' }
    const items = fnstate([a, b], o => o.id)
    const container = h('div')
    let renders = 0
    const observed = []
    items.bindChildren(container, item => {
      item.subscribe(v => observed.push(v))
      return h('div', item.bindAs(v => { renders++; return h('span', v.v) }))
    })
    expect(renders).toBe(2)

    // same references, new array: nothing is pushed into the item states
    items([a, b])
    items(items().slice())
    await flush()
    expect(renders).toBe(2)
    expect(observed.length).toBe(0)

    // same array, same references, called again (e.g. after in-place mutation)
    a.v = 'mutated'
    items(items())
    await flush()
    expect(renders).toBe(2)
    expect(container.children[0].innerText).toBe('a')

    // replacing the object re-renders only that item
    const a2 = { id: 1, v: 'a2' }
    items([a2, b])
    await flush()
    expect(renders).toBe(3)
    expect(observed).toEqual([a2])
    expect(container.children[0].innerText).toBe('a2')
    expect(container.children[1].innerText).toBe('b')
  })

  it('writes item state updates back into the parent array at the right index', async () => {
    const items = fnstate([{ id: 1 }, { id: 2 }, { id: 3 }], o => o.id)
    const container = h('div')
    const states = {}
    items.bindChildren(container, item => {
      states[item().id] = item
      return h('div', item.bindAs(v => h('span', `${v.id}:${v.n ?? 0}`)))
    })

    states[2]({ id: 2, n: 1 })
    await flush()
    expect(items()[1]).toEqual({ id: 2, n: 1 })
    expect(container.children[1].innerText).toBe('2:1')

    // reorder through the parent, then update again: the index is refreshed
    items([items()[2], items()[0], items()[1]])
    await flush()
    states[2]({ id: 2, n: 2 })
    expect(items()[2]).toEqual({ id: 2, n: 2 })
    expect(items()[0]).toEqual({ id: 3 })

    // reorder the array in place without telling the parent: the recorded
    // index no longer matches the key, so the write-back falls back to a scan
    const arr = items()
    arr.reverse()
    states[2]({ id: 2, n: 3 })
    expect(arr.findIndex(o => o.id === 2)).toBe(0)
    expect(arr[0]).toEqual({ id: 2, n: 3 })

    // a removed item no longer writes into the array
    items([{ id: 1 }, { id: 3 }])
    states[2]({ id: 2, n: 4 })
    expect(items().some(o => o.id === 2)).toBe(false)
  })

  it('resets the state and throws on duplicate keys', () => {
    const items = fnstate([{ id: 1 }, { id: 2 }], o => o.id)
    const container = h('div')
    items.bindChildren(container, item => h('div', `${item().id}`))
    expect(() => items([{ id: 1 }, { id: 3 }, { id: 1 }])).toThrow(/Duplicate keys/)
    expect(items().map(o => o.id)).toEqual([1, 2])
    expect(container.innerText).toBe('12')
    expect(items._ctx.bindContexts[0].items.size).toBe(2)
    expect(items._ctx.bindContexts[0].items.get(3)).toBeUndefined()

    items([{ id: 2 }, { id: 1 }])
    expect(container.innerText).toBe('21')
  })

  it('follows an item root node that a bindAs on another state replaces', async () => {
    const items = fnstate([{ id: 1 }, { id: 2 }, { id: 3 }], o => o.id)
    const mode = fnstate('a')
    const container = h('div')
    items.bindChildren(container, item => mode.bindAs(m => h('div', `${item().id}${m}`)))
    expect(container.innerText).toBe('1a2a3a')

    mode('b')
    await flush()
    expect(container.innerText).toBe('1b2b3b')

    // the list still reconciles against the live nodes
    items([{ id: 3 }, { id: 1 }])
    await flush()
    expect(container.innerText).toBe('3b1b')
    expect(container.children.length).toBe(2)
    expect(items._ctx.bindContexts[0].items.get(1).node).toBe(container.children[1])

    items([{ id: 1 }, { id: 4 }])
    mode('c')
    await flush()
    expect(container.innerText).toBe('1c4c')
    expect(container.children.length).toBe(2)
  })

  it('removes stray nodes when the array shrinks from the end and the start', () => {
    const items = fnstate([1, 2, 3, 4, 5])
    const container = h('div')
    items.bindChildren(container, i => h('div', `${i()}`))
    items([2, 3, 4])
    expect(container.innerText).toBe('234')
    expect(items._ctx.bindContexts[0].items.size).toBe(3)
    items([3])
    expect(container.innerText).toBe('3')
    expect(items._ctx.bindContexts[0].items.size).toBe(1)
    items([])
    expect(container.innerText).toBe('')
    expect(items._ctx.bindContexts[0].items.size).toBe(0)
    items([9, 3])
    expect(container.innerText).toBe('93')
  })
})
