import { fnstate, h } from '../../docs/lib/fntags.mjs'

describe('fnstate', () => {
  it('should initialize with the given value', () => {
    const s = fnstate('initial')
    expect(s()).to.eq('initial')
  })

  it('should update the value', () => {
    const s = fnstate('initial')
    s('new')
    expect(s()).to.eq('new')
  })

  it('should notify subscribers', () => {
    const s = fnstate('initial')
    let notified = false
    s.subscribe((newVal, oldVal) => {
      expect(newVal).to.eq('new')
      expect(oldVal).to.eq('initial')
      notified = true
    })
    s('new')
    expect(notified).to.eq(true)
  })

  describe('bindAs', () => {
    it('should bind to an element', () => {
      const s = fnstate('initial')
      const el = h('div', s.bindAs(() => h('span', s())))
      expect(el.innerText).to.eq('initial')
      s('new')
      expect(el.innerText).to.eq('new')
    })

    it('should bind to an element without a function if the state is a node', () => {
      const s = fnstate(h('div', 'initial'))
      const el = h('div', s.bindAs())
      expect(el.innerText).to.eq('initial')
      s(h('div', 'new'))
      expect(el.innerText).to.eq('new')
    })
  })

  describe('bindChildren', () => {
    it('should handle reordering', () => {
      const s = fnstate([1, 2, 3])
      const container = h('div')
      // Using direct binding to check if elements are reused/moved could be tricky without keys,
      // but fnstate uses keys if provided or index.
      // Let's rely on text content for now.
      s.bindChildren(container, (i) => h('div', i()))
      expect(container.innerText).to.eq('123')
      s([3, 2, 1])
      expect(container.innerText).to.eq('321')
    })

    it('should use mapKey', () => {
      const s = fnstate([{ id: 1, val: 'a' }, { id: 2, val: 'b' }], (o) => o.id)
      const container = h('div')
      s.bindChildren(container, (item) => {
        const el = h('div', item.bindProp('val'))
        el.dataset.id = item().id
        return el
      })
      const firstEl = container.children[0]
      expect(firstEl.innerText).to.eq('a')

      // Update item 1
      s([{ id: 1, val: 'aa' }, { id: 2, val: 'b' }])
      expect(container.children[0]).to.eq(firstEl) // Should be same element
      expect(container.children[0].innerText).to.eq('aa')
    })
  })

  describe('bindProp', () => {
    it('should bind to a property', () => {
      const s = fnstate({ foo: 'bar' })
      const el = h('div', s.bindProp('foo'))
      expect(el.innerText).to.eq('bar')
      s({ foo: 'baz' })
      expect(el.innerText).to.eq('baz')
    })
  })

  describe('bindAttr', () => {
    it('should bind to an attribute', () => {
      const s = fnstate('foo')
      const el = h('div', { class: s.bindAttr() })
      expect(el.className).to.eq('foo')
      s('bar')
      expect(el.className).to.eq('bar')
    })
  })

  describe('bindStyle', () => {
    it('should bind to a style', () => {
      const s = fnstate('red')
      const el = h('div', { style: { color: s.bindStyle() } })
      expect(el.style.color).to.eq('red')
      s('blue')
      expect(el.style.color).to.eq('blue')
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

      expect(container.children[0].className).to.not.contain('selected')

      s.select(0)
      expect(container.children[0].className).to.contain('selected')
      expect(container.children[1].className).to.not.contain('selected')

      s.select(1)
      expect(container.children[0].className).to.not.contain('selected')
      expect(container.children[1].className).to.contain('selected')
    })
  })

  describe('assign', () => {
    it('should assign properties to object state', () => {
      const s = fnstate({ a: 1, b: 2 })
      s.assign({ b: 3 })
      expect(s()).to.deep.equal({ a: 1, b: 3 })
    })
  })

  describe('path', () => {
    it('should get path', () => {
      const s = fnstate({ a: { b: { c: 1 } } })
      expect(s.getPath('a.b.c')).to.eq(1)
    })
    it('should set path', () => {
      const s = fnstate({ a: { b: { c: 1 } } })
      s.setPath('a.b.c', 2)
      expect(s().a.b.c).to.eq(2)
    })
    it('should set path with fill', () => {
      const s = fnstate({})
      s.setPath('a.b.c', 2, true)
      expect(s().a.b.c).to.eq(2)
    })
  })

  describe('reset', () => {
    it('should reset to initial value', () => {
      const s = fnstate('initial')
      s('changed')
      s.reset(true)
      expect(s()).to.eq('initial')
    })
  })
})
