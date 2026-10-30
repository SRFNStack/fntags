import { describe, it, expect, vi, afterEach } from 'vitest'
import { h, fnstate, fntemplate, delegateEvents, setDevMode } from '@srfnstack/fntags'

// Templates compiled before delegateEvents keep using addEventListener, so this
// file covers both paths: `row` is not delegated, `drow` is.
const row = fntemplate(ctx =>
  h('tr', { class: ctx('cls'), onclick: ctx('select') },
    h('td', { class: 'id' }, ctx('id')),
    h('td', h('a', ctx('label'))),
    h('td', h('a', h('span', { onclick: ctx('remove') }))),
    h('td', { class: 'pad' })
  )
)

delegateEvents(['click'])

const drow = fntemplate(ctx =>
  h('tr', { class: ctx('cls'), onclick: ctx('select') },
    h('td', { class: 'id' }, ctx('id')),
    h('td', h('a', ctx('label'))),
    h('td', h('a', h('span', { onclick: ctx('remove') })))
  )
)

const flush = () => new Promise(resolve => setTimeout(resolve))

afterEach(() => {
  document.body.textContent = ''
})

const items = (...ids) => ids.map(id => ({ id, label: 'item ' + id }))

function makeList (template = row, initial = items(1, 2, 3), extra = {}) {
  const data = fnstate(initial, d => d.id)
  const calls = []
  const handled = []
  const tbody = data.bindRows(h('tbody'), template, {
    values: (item, selected) => {
      calls.push(item.id)
      return { id: item.id, label: item.label, cls: selected === item.id ? 'danger' : '' }
    },
    handlers: {
      select: (e, item) => {
        handled.push(['select', item])
        data.select(item.id)
      },
      remove: (e, item) => {
        handled.push(['remove', item])
        e.stopPropagation()
        data(data().filter(d => d.id !== item.id))
      }
    },
    ...extra
  })
  document.body.append(h('table', tbody))
  return { data, tbody, calls, handled }
}

const texts = tbody => [...tbody.children].map(tr => tr.querySelector('a').textContent)
const click = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))

describe('bindRows', () => {
  it('mounts one row per item and returns the parent', () => {
    const { tbody, calls } = makeList()
    expect(tbody.tagName).toBe('TBODY')
    expect(tbody.children.length).toBe(3)
    expect(texts(tbody)).toEqual(['item 1', 'item 2', 'item 3'])
    expect(tbody.children[0].querySelector('.id').textContent).toBe('1')
    expect(calls).toEqual([1, 2, 3])
  })

  it('skips empty attributes on mount', () => {
    const { tbody } = makeList()
    expect(tbody.children[0].hasAttribute('class')).toBe(false)
  })

  it('requires an fntemplate with a single root element', () => {
    const data = fnstate([], d => d.id)
    expect(() => data.bindRows(h('tbody'), () => h('tr'))).toThrow(/fntemplate/)
    const frag = fntemplate(ctx => [h('td', ctx('a')), h('td')])
    expect(() => data.bindRows(h('tbody'), frag)).toThrow(/single root element/)
  })

  it('rejects a handler on a slot that is not an event', () => {
    const data = fnstate([], d => d.id)
    expect(() => data.bindRows(h('tbody'), row, { handlers: { label: () => {} } })).toThrow(/on\* attribute/)
  })

  it('skips rows whose item reference did not change', () => {
    const { data, calls } = makeList()
    calls.length = 0
    data(data().slice())
    expect(calls).toEqual([])
  })

  it('writes only the slots whose value changed and keeps text nodes', () => {
    const { data, tbody, calls } = makeList()
    const tr = tbody.children[1]
    const labelText = tr.querySelector('a').firstChild
    const idText = tr.querySelector('.id').firstChild
    const setSpy = vi.spyOn(Element.prototype, 'setAttribute')
    const removeSpy = vi.spyOn(Element.prototype, 'removeAttribute')
    calls.length = 0
    const next = data().slice()
    next[1] = { id: 2, label: 'changed' }
    data(next)
    expect(calls).toEqual([2])
    expect(setSpy).not.toHaveBeenCalled()
    expect(removeSpy).not.toHaveBeenCalled()
    setSpy.mockRestore()
    removeSpy.mockRestore()
    expect(tbody.children[1]).toBe(tr)
    expect(tr.querySelector('a').firstChild).toBe(labelText)
    expect(labelText.data).toBe('changed')
    expect(tr.querySelector('.id').firstChild).toBe(idText)
  })

  it('select re-runs only the previously and newly selected rows', () => {
    const { data, tbody, calls } = makeList(row, items(1, 2, 3, 4, 5))
    calls.length = 0
    data.select(2)
    expect(calls).toEqual([2])
    expect(tbody.children[1].className).toBe('danger')
    calls.length = 0
    data.select(4)
    expect(calls).toEqual([2, 4])
    expect(tbody.children[1].hasAttribute('class')).toBe(false)
    expect(tbody.children[3].className).toBe('danger')
    expect(data.selected()).toBe(4)
    calls.length = 0
    data.select(4)
    expect(calls).toEqual([])
  })

  it('keeps bindSelectAttr on other bindings of the same state working', () => {
    const data = fnstate(items(1, 2), d => d.id)
    data.bindRows(h('tbody'), row, { values: (item, sel) => ({ id: item.id, label: item.label, cls: sel === item.id ? 'on' : '' }) })
    const other = data.bindChildren(h('ul'), item => h('li', { class: item.bindSelectAttr(() => data.selected() === item().id ? 'on' : '') }))
    data.select(2)
    expect(other.children[1].className).toBe('on')
  })

  it('swap moves rows without recreating them', () => {
    const { data, tbody, calls } = makeList(row, items(1, 2, 3, 4, 5))
    const before = [...tbody.children]
    calls.length = 0
    const next = data().slice()
    const a = next[1]
    next[1] = next[3]
    next[3] = a
    data(next)
    expect(calls).toEqual([])
    const after = [...tbody.children]
    expect(after).toEqual([before[0], before[3], before[2], before[1], before[4]])
    expect(texts(tbody)).toEqual(['item 1', 'item 4', 'item 3', 'item 2', 'item 5'])
  })

  it('removes one row and keeps the others', () => {
    const { data, tbody } = makeList(row, items(1, 2, 3, 4))
    const before = [...tbody.children]
    data(data().filter(d => d.id !== 2))
    expect([...tbody.children]).toEqual([before[0], before[2], before[3]])
    expect(before[1].parentNode).toBe(null)
  })

  it('clears', () => {
    const { data, tbody } = makeList()
    data([])
    expect(tbody.children.length).toBe(0)
    data(items(7))
    expect(texts(tbody)).toEqual(['item 7'])
  })

  it('replaces every row when no key survives', () => {
    const { data, tbody } = makeList()
    const old = [...tbody.children]
    data(items(4, 5))
    expect(texts(tbody)).toEqual(['item 4', 'item 5'])
    expect(old.some(n => n.parentNode !== null)).toBe(false)
    data(items(4, 5, 6).reverse())
    expect(texts(tbody)).toEqual(['item 6', 'item 5', 'item 4'])
  })

  it('throws on duplicate keys and resets the state', () => {
    const { data, tbody } = makeList()
    const prev = data()
    expect(() => data([...items(1, 2), { id: 1, label: 'dup' }])).toThrow(/Duplicate keys/)
    expect(data()).toBe(prev)
    expect(texts(tbody)).toEqual(['item 1', 'item 2', 'item 3'])
  })

  it('passes the current item to handlers after an update', () => {
    const { data, tbody, handled } = makeList()
    const next = data().slice()
    const updated = { id: 2, label: 'new' }
    next[1] = updated
    data(next)
    click(tbody.children[1])
    expect(handled[0][1]).toBe(updated)
    expect(data.selected()).toBe(2)
    expect(tbody.children[1].className).toBe('danger')
  })

  it('shares one listener per handler name across rows (non delegated)', () => {
    const { tbody } = makeList()
    let proto = h('tr')
    while (!Object.prototype.hasOwnProperty.call(proto, 'addEventListener')) proto = Object.getPrototypeOf(proto)
    const spy = vi.spyOn(proto, 'addEventListener')
    const data = fnstate(items(1, 2), d => d.id)
    const fn = () => {}
    data.bindRows(h('tbody'), row, { handlers: { select: fn, remove: fn } })
    const listeners = spy.mock.calls.map(c => c[1])
    spy.mockRestore()
    expect(listeners.length).toBe(4)
    expect(listeners[0]).toBe(listeners[2])
    expect(tbody.children[0].__fnon_click).toBe(undefined)
  })

  it('remove with stopPropagation does not select (non delegated)', () => {
    const { data, tbody, handled } = makeList()
    click(tbody.children[1].querySelector('span'))
    expect(handled.map(h => h[0])).toEqual(['remove'])
    expect(data.selected()).toBe(undefined)
    expect(texts(tbody)).toEqual(['item 1', 'item 3'])
  })

  it('delegated handlers are stored on the element and get the current item', () => {
    const { data, tbody, handled } = makeList(drow)
    const tr = tbody.children[0]
    expect(typeof tr.__fnon_click).toBe('function')
    expect(tr.__fnon_click).toBe(tbody.children[1].__fnon_click)
    const next = data().slice()
    next[0] = { id: 1, label: 'x' }
    data(next)
    click(tr.querySelector('td'))
    expect(handled[0][0]).toBe('select')
    expect(handled[0][1]).toBe(next[0])
    expect(tr.className).toBe('danger')
  })

  it('remove with stopPropagation does not select (delegated)', () => {
    const { data, tbody, handled } = makeList(drow)
    click(tbody.children[2].querySelector('span'))
    expect(handled.map(h => h[0])).toEqual(['remove'])
    expect(data.selected()).toBe(undefined)
    expect(texts(tbody)).toEqual(['item 1', 'item 2'])
  })

  it('handlers of a removed row do nothing', () => {
    const { data, tbody, handled } = makeList(drow)
    const tr = tbody.children[0]
    data(data().slice(1))
    tr.__fnon_click(new MouseEvent('click'))
    expect(handled).toEqual([])
  })

  it('values defaults to the item', () => {
    const data = fnstate([{ id: 1, label: 'a', cls: 'c' }], d => d.id)
    const tbody = data.bindRows(h('tbody'), row)
    expect(tbody.children[0].className).toBe('c')
    expect(tbody.children[0].querySelector('a').textContent).toBe('a')
  })

  it('does not allocate a scope for rows without bindings', () => {
    const { data, tbody } = makeList()
    data.select(1)
    expect(data._ctx.rowBindings[0].scoped).toBe(0)
    for (const tr of tbody.children) expect(tr._fnRow.scope).toBe(null)
  })

  describe('escape hatch', () => {
    it('bindAs label updates and is cleaned up on re-run and removal', async () => {
      const suffix = fnstate('!')
      const data = fnstate(items(1, 2, 3), d => d.id)
      const tbody = data.bindRows(h('tbody'), drow, {
        values: (item, sel) => ({
          id: item.id,
          label: suffix.bindAs(s => item.label + s),
          cls: sel === item.id ? 'danger' : ''
        })
      })
      document.body.append(h('table', tbody))
      expect(texts(tbody)).toEqual(['item 1!', 'item 2!', 'item 3!'])
      expect(suffix._ctx.observers.length).toBe(3)

      suffix('?')
      await flush()
      expect(texts(tbody)).toEqual(['item 1?', 'item 2?', 'item 3?'])

      // re-run through selection: the old binding is disposed, the new one renders
      data.select(2)
      expect(suffix._ctx.observers.length).toBe(3)
      expect(tbody.children[1].className).toBe('danger')
      expect(texts(tbody)).toEqual(['item 1?', 'item 2?', 'item 3?'])
      suffix('#')
      await flush()
      expect(texts(tbody)).toEqual(['item 1#', 'item 2#', 'item 3#'])

      // re-run through an item update
      const next = data().slice()
      next[0] = { id: 1, label: 'one' }
      data(next)
      expect(suffix._ctx.observers.length).toBe(3)
      expect(texts(tbody)).toEqual(['one#', 'item 2#', 'item 3#'])

      data(data().filter(d => d.id !== 3))
      expect(suffix._ctx.observers.length).toBe(2)
      data([])
      expect(suffix._ctx.observers.length).toBe(0)
    })

    it('replace-all disposes the old rows bindings', () => {
      const s = fnstate('x')
      const data = fnstate(items(1, 2), d => d.id)
      data.bindRows(h('tbody'), row, { values: item => ({ id: item.id, label: s.bindAs(), cls: s.bindAttr(() => 'c' + s()) }) })
      expect(s._ctx.observers.length).toBe(4)
      data(items(3, 4, 5))
      expect(s._ctx.observers.length).toBe(6)
      data([])
      expect(s._ctx.observers.length).toBe(0)
    })

    it('bindAttr slot updates in place and switches back to a primitive', () => {
      const cls = fnstate('a')
      const data = fnstate(items(1), d => d.id)
      const tbody = data.bindRows(h('tbody'), row, {
        values: (item, sel) => ({ id: item.id, label: item.label, cls: sel === item.id ? 'danger' : cls.bindAttr() })
      })
      const tr = tbody.children[0]
      expect(tr.className).toBe('a')
      cls('b')
      expect(tr.className).toBe('b')
      data.select(1)
      expect(tr.className).toBe('danger')
      expect(cls._ctx.observers.length).toBe(0)
    })

    it('node values replace the slot and back to text', () => {
      const data = fnstate([{ id: 1, label: 'a', node: true }], d => d.id)
      const tbody = data.bindRows(h('tbody'), row, {
        values: item => ({ id: item.id, label: item.node ? h('b', item.label) : item.label })
      })
      const a = tbody.querySelector('a')
      expect(a.firstChild.tagName).toBe('B')
      data([{ id: 1, label: 'plain', node: false }])
      expect(a.innerHTML).toBe('plain')
      data([{ id: 1, label: 'bold', node: true }])
      expect(a.innerHTML).toBe('<b>bold</b>')
    })

    it('rejects arrays for child slots', () => {
      const data = fnstate(items(1), d => d.id)
      expect(() => data.bindRows(h('tbody'), row, { values: () => ({ label: [h('b'), h('i')] }) })).toThrow(/not an array/)
    })
  })

  it('cleans up when created inside a bindAs render', async () => {
    const show = fnstate(true)
    const suffix = fnstate('!')
    const data = fnstate(items(1, 2), d => d.id)
    const el = show.bindAs(() => show()
      ? h('table', data.bindRows(h('tbody'), row, { values: item => ({ id: item.id, label: suffix.bindAs(s => item.label + s) }) }))
      : h('div', 'gone'))
    document.body.append(h('div', el))
    expect(data._ctx.observers.length).toBe(1)
    expect(data._ctx.rowBindings.length).toBe(1)
    expect(suffix._ctx.observers.length).toBe(2)
    show(false)
    await flush()
    expect(data._ctx.observers.length).toBe(0)
    expect(data._ctx.rowBindings.length).toBe(0)
    expect(suffix._ctx.observers.length).toBe(0)
    // updating the list after teardown touches nothing
    data(items(3))
    expect(document.body.textContent).toBe('gone')
  })

  it('wraps a non-array update in an array', () => {
    setDevMode(false)
    const data = fnstate(items(1), d => d.id)
    const tbody = data.bindRows(h('tbody'), row)
    data({ id: 9, label: 'nine' })
    setDevMode(true)
    expect(texts(tbody)).toEqual(['nine'])
  })
})

// Rows whose values are all primitives are written into a private copy of the
// template and cloned. Every row must come out exactly as a fill of a fresh
// clone (what the template function itself produces) would.
describe('bindRows write then clone', () => {
  const wide = fntemplate(ctx =>
    h('div', { class: ctx('cls'), title: ctx('title'), 'data-x': 'static', 'data-y': ctx('y') },
      h('span', ctx('only')),
      'a', ctx('text'), 'b',
      h('i', { style: { color: ctx('color'), margin: '1px' } }),
      h('b', { style: { color: ctx('color2'), width: ctx('width') } }, ctx('only2')),
      h('u', ctx('z'))
    )
  )

  const valueSets = [
    { id: 1, cls: 'a', title: 't', y: 'y', only: 'x', text: 'hello', color: 'red', color2: 'blue', width: '2px', only2: 0 },
    { id: 2, cls: '', title: 't', y: null, only: '', text: '', color: '', color2: '', width: '', only2: '' },
    { id: 3, cls: 'c', title: '', y: 'y', only: 12, text: 3.5, color: 'red', color2: null, width: '3px', only2: null },
    { id: 4, cls: 'c', title: 'u', y: undefined, only: true, text: false, color: 'green', color2: 'red', width: undefined, only2: undefined },
    { id: 5, cls: null, title: null, y: 'z', only: 'x', text: 'hello', color: null, color2: 'blue', width: '2px', only2: 'w' },
    { id: 6, cls: 'a', title: 't', y: 'y', only: 'x', text: 'hello', color: 'red', color2: 'blue', width: '2px', only2: 0 },
    { id: 7, cls: 'a', title: 't', y: 'y', only: 'x', text: 'hello', color: 'red', color2: 'blue', width: '2px', only2: 0 }
  ]

  const expected = vals => wide(vals).outerHTML

  it('produces the same markup as a fresh fill for text, empty, numbers, null, attributes and styles', () => {
    const data = fnstate(valueSets, d => d.id)
    const parent = data.bindRows(h('section'), wide)
    expect([...parent.children].map(c => c.outerHTML)).toEqual(valueSets.map(expected))
    // An empty TPL_ONLY slot still holds one empty text node.
    const second = parent.children[1]
    expect(second.firstChild.childNodes.length).toBe(1)
    expect(second.firstChild.firstChild.data).toBe('')
    expect(second.childNodes.length).toBe(wide(valueSets[1]).childNodes.length)
  })

  it('mixes rows that are filled after the clone with rows written into the master', () => {
    const vals = [
      { id: 1, cls: 'a', text: 'one' },
      { id: 2, cls: 'b', text: h('em', 'node') },
      { id: 3, cls: '', text: 'three' },
      { id: 4, cls: 'd', text: () => 'fn' },
      { id: 5, cls: 'a', text: 'one' }
    ]
    const tpl = fntemplate(ctx => h('p', { class: ctx('cls') }, 'x', ctx('text')))
    const data = fnstate(vals, d => d.id)
    const parent = data.bindRows(h('div'), tpl)
    expect([...parent.children].map(c => c.outerHTML)).toEqual([
      '<p class="a">xone</p>',
      '<p class="b">x<em>node</em></p>',
      '<p>xthree</p>',
      '<p class="d">xfn</p>',
      '<p class="a">xone</p>'
    ])
  })

  it('leaves the template unchanged for direct use', () => {
    const tpl = fntemplate(ctx => h('p', { class: ctx('cls') }, h('b', ctx('text')), ctx('more')))
    const before = tpl({}).outerHTML
    const data = fnstate([{ id: 1, cls: 'k', text: 'bold', more: 'm' }], d => d.id)
    const parent = data.bindRows(h('div'), tpl)
    expect(parent.firstChild.outerHTML).toBe('<p class="k"><b>bold</b>m</p>')
    expect(tpl({}).outerHTML).toBe(before)
    expect(tpl({ cls: 'z', text: 't', more: 1 }).outerHTML).toBe('<p class="z"><b>t</b>1</p>')
    expect(tpl._fnTemplate.root.outerHTML).toBe('<p><b></b></p>')
  })

  // The same rows through the clone, walk and fill path: a function in the
  // z slot makes every row ineligible for the master and renders ''.
  const zfn = () => ''
  const twin = sets => {
    const fast = fnstate(sets.map(v => ({ ...v, z: '' })), d => d.id)
    const slow = fnstate(sets.map(v => ({ ...v, z: zfn })), d => d.id)
    return { fast, slow, a: fast.bindRows(h('section'), wide), b: slow.bindRows(h('section'), wide) }
  }
  const html = parent => [...parent.children].map(c => c.outerHTML)

  it('mounts the same markup as the clone and fill path', () => {
    const { a, b } = twin(valueSets)
    expect(html(a)).toEqual(html(b))
  })

  it('updates after a write then clone mount hit the right nodes', () => {
    const { fast, slow, a, b } = twin(valueSets.slice(0, 3))
    const next = [valueSets[3], valueSets[4], valueSets[0]].map((v, i) => ({ ...v, id: i + 1 }))
    fast(next.map(v => ({ ...v, z: '' })))
    slow(next.map(v => ({ ...v, z: zfn })))
    expect(html(a)).toEqual(html(b))
    expect(a.children[1].outerHTML).toBe(b.children[1].outerHTML)
    expect(a.children[0].querySelector('span').textContent).toBe('true')
    // A later mount still starts from a correct master after the updates.
    fast([...fast(), { ...valueSets[1], id: 9, z: '' }])
    expect(a.children[3].outerHTML).toBe(expected({ ...valueSets[1], z: '' }))
  })

  it('keeps the values object for later diffs', () => {
    const tpl = fntemplate(ctx => h('p', ctx('text')))
    const data = fnstate([{ id: 1, text: 'a' }], d => d.id)
    const parent = data.bindRows(h('div'), tpl)
    const textNode = parent.firstChild.firstChild
    data([{ id: 1, text: 'a' }])
    expect(parent.firstChild.firstChild).toBe(textNode)
    data([{ id: 1, text: 'b' }])
    expect(parent.firstChild.firstChild).toBe(textNode)
    expect(textNode.data).toBe('b')
  })

  it('handlers get the current item on rows mounted from the master', () => {
    const tpl = fntemplate(ctx => h('li', { class: ctx('cls') }, h('span', ctx('label')), h('button', { onclick: ctx('go'), onmouseover: ctx('hover') }, 'go')))
    const data = fnstate([{ id: 1, label: 'a' }, { id: 2, label: 'b' }], d => d.id)
    const seen = []
    const parent = data.bindRows(h('ul'), tpl, {
      values: item => ({ label: item.label, cls: item.id === 2 ? 'two' : '' }),
      handlers: { go: (e, item) => seen.push(item.label), hover: (e, item) => seen.push('h' + item.label) }
    })
    document.body.append(parent)
    data([{ id: 1, label: 'a2' }, data()[1]])
    click(parent.children[0].querySelector('button'))
    click(parent.children[1].querySelector('button'))
    parent.children[1].querySelector('button').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    expect(seen).toEqual(['a2', 'b', 'hb'])
    expect(parent.children[1].outerHTML).toBe('<li class="two"><span>b</span><button>go</button></li>')
  })

  it('finds handler nodes from either end of their siblings', () => {
    const tpl = fntemplate(ctx => h('div',
      h('a', { onclick: ctx('first') }, 'f'),
      h('span', ctx('t')),
      'text',
      h('i', h('b', ctx('u')), h('u', { onmouseover: ctx('deep') })),
      h('em')
    ))
    const data = fnstate([{ id: 1, t: 'x', u: 'y' }, { id: 2, t: '', u: 'z' }], d => d.id)
    const seen = []
    const parent = data.bindRows(h('section'), tpl, {
      handlers: { first: (e, item) => seen.push('f' + item.id), deep: (e, item) => seen.push('d' + item.id) }
    })
    document.body.append(parent)
    for (const el of parent.children) {
      click(el.querySelector('a'))
      el.querySelector('u').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    }
    expect(seen).toEqual(['f1', 'd1', 'f2', 'd2'])
    expect(parent.children[1].outerHTML).toBe('<div><a>f</a><span></span>text<i><b>z</b><u></u></i><em></em></div>')
  })
})
