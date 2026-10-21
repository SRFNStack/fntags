import { describe, it, expect } from 'vitest'
import { fnstate, h } from '@srfnstack/fntags'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

const rows = (from, count) => Array.from({ length: count }, (_, i) => ({ id: from + i, label: 'row ' + (from + i) }))

// A list whose rows subscribe to the item state, an outside state and the
// selection, like the benchmark app.
function setup (initial) {
  const data = fnstate(initial, d => d.id)
  const outside = fnstate('x')
  const items = []
  const tbody = data.bindChildren(h('tbody'), item => {
    items.push(item)
    return h('tr', {
      class: item.bindSelectAttr(() => data.selected() === item().id ? 'danger' : '')
    },
    h('td', item.bindAs(() => item().label)),
    h('td', outside.bindAs(() => outside()))
    )
  })
  return { data, outside, items, tbody }
}

const selectKeyCount = state => Object.keys(state._ctx.selectObservers).length
const ids = tbody => Array.from(tbody.children).map(tr => tr.firstChild.textContent)

describe('bindChildren replace with no surviving keys', () => {
  it('cleans up subscriptions and select observers of the old rows', () => {
    const { data, outside, items, tbody } = setup(rows(1, 5))
    expect(outside._ctx.observers.length).toBe(5)
    expect(selectKeyCount(data)).toBe(5)
    const oldItems = items.slice()
    const oldNodes = Array.from(tbody.children)

    data(rows(100, 3))

    expect(tbody.children.length).toBe(3)
    expect(ids(tbody)).toEqual(['row 100', 'row 101', 'row 102'])
    // only the new rows observe the outside state and the selection
    expect(outside._ctx.observers.length).toBe(3)
    expect(Object.keys(data._ctx.selectObservers).sort()).toEqual(['100', '101', '102'])
    // the discarded item states have no bindings left
    for (const item of oldItems) expect(item._ctx.observers.length).toBe(1)
    // removed nodes do not point back at their records
    for (const node of oldNodes) {
      expect(node._fnItem).toBe(undefined)
      expect(node.parentNode).toBe(null)
    }
  })

  it('keeps working after clear and re-add', async () => {
    const { data, outside, tbody } = setup(rows(1, 4))
    data([])
    expect(tbody.children.length).toBe(0)
    expect(outside._ctx.observers.length).toBe(0)
    expect(selectKeyCount(data)).toBe(0)

    data(rows(10, 2))
    expect(ids(tbody)).toEqual(['row 10', 'row 11'])
    expect(outside._ctx.observers.length).toBe(2)
    outside('y')
    await flush()
    expect(Array.from(tbody.children).map(tr => tr.lastChild.textContent)).toEqual(['y', 'y'])

    data([...data(), ...rows(12, 1)])
    expect(ids(tbody)).toEqual(['row 10', 'row 11', 'row 12'])
  })

  it('keeps node identity of surviving keys on a partial replace', () => {
    const { data, tbody } = setup(rows(1, 4))
    const before = Array.from(tbody.children)
    data([{ id: 3, label: 'row 3' }, ...rows(50, 2), { id: 1, label: 'row 1' }])
    const after = Array.from(tbody.children)
    expect(ids(tbody)).toEqual(['row 3', 'row 50', 'row 51', 'row 1'])
    expect(after[0]).toBe(before[2])
    expect(after[3]).toBe(before[0])
    expect(before[1].parentNode).toBe(null)
    expect(before[1]._fnItem).toBe(undefined)
  })

  it('selection works after a bulk replace', () => {
    const { data, tbody } = setup(rows(1, 3))
    data.select(2)
    expect(tbody.children[1].className).toBe('danger')
    data(rows(20, 3))
    expect(Array.from(tbody.children).map(tr => tr.className)).toEqual(['', '', ''])
    data.select(21)
    expect(Array.from(tbody.children).map(tr => tr.className)).toEqual(['', 'danger', ''])
    data.select(22)
    expect(Array.from(tbody.children).map(tr => tr.className)).toEqual(['', '', 'danger'])
  })

  it('keeps the selection observers of a second binding on the same state', () => {
    const data = fnstate(rows(1, 2), d => d.id)
    const build = item => h('div', { class: item.bindSelectAttr(() => data.selected() === item().id ? 'on' : '') }, item().label)
    const a = data.bindChildren(h('div'), build)
    const b = data.bindChildren(h('div'), build)
    data(rows(7, 2))
    data.select(8)
    expect(Array.from(a.children).map(n => n.className)).toEqual(['', 'on'])
    expect(Array.from(b.children).map(n => n.className)).toEqual(['', 'on'])
    expect(data._ctx.selectObservers[8].length).toBe(2)
    expect(selectKeyCount(data)).toBe(2)
  })

  it('resets state on duplicate keys in an all new array', () => {
    const { data, tbody } = setup(rows(1, 2))
    const before = Array.from(tbody.children)
    expect(() => data([{ id: 5 }, { id: 5 }])).toThrow(/Duplicate keys/)
    expect(data().map(d => d.id)).toEqual([1, 2])
    expect(Array.from(tbody.children)).toEqual(before)
  })
})
