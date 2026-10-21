import { describe, it, expect } from 'vitest'
import { h, fnstate, fntemplate } from '@srfnstack/fntags'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('fntemplate', () => {
  it('throws when not given a function', () => {
    expect(() => fntemplate('nope')).toThrow()
  })

  it('fills a primitive child placeholder as a text node in place', () => {
    const tpl = fntemplate(ctx => h('div', h('span', ctx('text'))))
    const a = tpl({ text: 'hello' })
    const b = tpl({ text: 42 })
    const c = tpl({ text: true })
    expect(a.querySelector('span').textContent).toBe('hello')
    expect(b.querySelector('span').textContent).toBe('42')
    expect(c.querySelector('span').textContent).toBe('true')
    expect(a.querySelector('span').childNodes.length).toBe(1)
    expect(a.querySelector('span').firstChild.nodeType).toBe(3)
  })

  it('renders null and undefined like renderNode does', () => {
    const tpl = fntemplate(ctx => h('div', ctx('text')))
    expect(tpl({ text: null }).textContent).toBe('null')
    expect(tpl({}).textContent).toBe('undefined')
  })

  it('keeps sibling text separate from the placeholder', () => {
    const tpl = fntemplate(ctx => h('p', 'Count: ', ctx('n'), '!'))
    const el = tpl({ n: 3 })
    expect(el.textContent).toBe('Count: 3!')
    expect(el.childNodes.length).toBe(3)
  })

  it('does not share nodes between instantiations', () => {
    const tpl = fntemplate(ctx => h('div', ctx('text')))
    const a = tpl({ text: 'a' })
    const b = tpl({ text: 'b' })
    expect(a.textContent).toBe('a')
    expect(b.textContent).toBe('b')
    expect(a.firstChild).not.toBe(b.firstChild)
  })

  it('evaluates a plain function value like renderNode does', () => {
    const tpl = fntemplate(ctx => h('div', ctx('text')))
    expect(tpl({ text: () => 'computed' }).textContent).toBe('computed')
    expect(tpl({ text: () => h('b', 'node') }).innerHTML).toBe('<b>node</b>')
    expect(tpl({ text: () => () => 'nested' }).textContent).toBe('nested')
  })

  it('renders an fnstate value as its current value', () => {
    const s = fnstate('state value')
    const tpl = fntemplate(ctx => h('div', ctx('text')))
    expect(tpl({ text: s }).textContent).toBe('state value')
  })

  it('bindAs getter child placeholder updates after a state change', async () => {
    const s = fnstate('one')
    const tpl = fntemplate(ctx => h('div', h('a', { class: 'lbl' }, ctx('label'))))
    const getter = s.bindAs(() => s())
    const original = getter()
    const el = tpl({ label: getter })
    document.body.append(el)
    expect(el.querySelector('a').textContent).toBe('one')
    // the getter adopted the placeholder text node instead of inserting its own node
    expect(getter()).not.toBe(original)
    expect(getter()).toBe(el.querySelector('a').firstChild)
    s('two')
    await flush()
    expect(el.querySelector('a').textContent).toBe('two')
    s('three')
    await flush()
    expect(el.querySelector('a').textContent).toBe('three')
    expect(el.querySelector('a').childNodes.length).toBe(1)
    el.remove()
  })

  it('bindAs getter that resolves to an element is placed and keeps updating', async () => {
    const s = fnstate(1)
    const tpl = fntemplate(ctx => h('div', ctx('child')))
    const el = tpl({ child: s.bindAs(v => h('span', { class: 'v' + v }, 'v' + v)) })
    expect(el.innerHTML).toBe('<span class="v1">v1</span>')
    s(2)
    await flush()
    expect(el.innerHTML).toBe('<span class="v2">v2</span>')
  })

  it('bindAs getter that switches from text to element and back keeps updating', async () => {
    const s = fnstate(0)
    const tpl = fntemplate(ctx => h('div', ctx('child')))
    const el = tpl({ child: s.bindAs(v => v % 2 === 0 ? 'text' + v : h('i', 'el' + v)) })
    expect(el.innerHTML).toBe('text0')
    s(1)
    await flush()
    expect(el.innerHTML).toBe('<i>el1</i>')
    s(2)
    await flush()
    expect(el.innerHTML).toBe('text2')
  })

  it('bindAs getter nested inside another bindAs keeps updating from the inner state', async () => {
    const outer = fnstate('o')
    const inner = fnstate('i1')
    const tpl = fntemplate(ctx => h('div', ctx('child')))
    const getter = outer.bindAs(() => inner.bindAs(() => inner()))
    const original = getter()
    const el = tpl({ child: getter })
    expect(el.textContent).toBe('i1')
    // shared with the inner getter, so the node is inserted rather than adopted
    expect(getter()).toBe(original)
    expect(el.firstChild).toBe(original)
    inner('i2')
    await flush()
    expect(el.textContent).toBe('i2')
    outer('o2')
    await flush()
    expect(el.textContent).toBe('i2')
    inner('i3')
    await flush()
    expect(el.textContent).toBe('i3')
  })

  it('same prop used as attribute and child', () => {
    const tpl = fntemplate(ctx => h('tr', { id: ctx('id') }, h('td', ctx('id'))))
    const el = tpl({ id: 7 })
    expect(el.getAttribute('id')).toBe('7')
    expect(el.querySelector('td').textContent).toBe('7')
  })

  it('same prop used as two children', () => {
    const tpl = fntemplate(ctx => h('div', h('span', ctx('t')), h('b', ctx('t'))))
    const el = tpl({ t: 'twice' })
    expect(el.querySelector('span').textContent).toBe('twice')
    expect(el.querySelector('b').textContent).toBe('twice')
  })

  it('same bind getter used as two children still updates after a state change', async () => {
    const s = fnstate('x')
    const tpl = fntemplate(ctx => h('div', h('span', ctx('t')), h('b', ctx('t'))))
    const getter = s.bindAs(() => s())
    const el = tpl({ t: getter })
    expect(el.textContent).toBe('x')
    s('y')
    await flush()
    expect(el.textContent).toBe('y')
    expect(getter().parentNode).not.toBeNull()
  })

  it('placeholder as a plain attribute', () => {
    const tpl = fntemplate(ctx => h('div', { id: ctx('id'), class: ctx('cls'), 'data-x': ctx('x') }))
    const el = tpl({ id: 'a1', cls: 'c', x: 5 })
    expect(el.id).toBe('a1')
    expect(el.className).toBe('c')
    expect(el.getAttribute('data-x')).toBe('5')
  })

  it('placeholder as a value and boolean attribute goes through the normal attribute rules', () => {
    const tpl = fntemplate(ctx => h('input', { type: 'text', value: ctx('v'), disabled: ctx('d') }))
    const el = tpl({ v: 'typed', d: true })
    expect(el.value).toBe('typed')
    expect(el.getAttribute('value')).toBe('typed')
    expect(el.disabled).toBe(true)
    expect(tpl({ v: '', d: false }).disabled).toBe(false)
  })

  it('placeholder as a namespaced attribute', () => {
    const tpl = fntemplate(ctx => h('http://www.w3.org/2000/svg:svg', h('http://www.w3.org/2000/svg:use', { 'http://www.w3.org/1999/xlink:href': ctx('href') })))
    const el = tpl({ href: '#icon' })
    expect(el.firstChild.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#icon')
  })

  it('placeholder as an event handler', () => {
    const tpl = fntemplate(ctx => h('button', { onclick: ctx('click') }, 'go'))
    let clicks = 0
    const el = tpl({ click: () => clicks++ })
    el.click()
    el.click()
    expect(clicks).toBe(2)
    const other = tpl({ click: () => { clicks += 10 } })
    other.click()
    expect(clicks).toBe(12)
  })

  it('placeholder as a bound attribute updates when the state changes', () => {
    const s = fnstate('a')
    const tpl = fntemplate(ctx => h('div', { class: ctx('cls') }))
    const el = tpl({ cls: s.bindAttr() })
    expect(el.className).toBe('a')
    s('b')
    expect(el.className).toBe('b')
  })

  it('placeholder as a bindSelectAttr updates on select', () => {
    const items = fnstate([{ id: 1 }, { id: 2 }], o => o.id)
    const tpl = fntemplate(ctx => h('tr', { class: ctx('cls') }, h('td', ctx('id'))))
    const container = h('tbody')
    items.bindChildren(container, item =>
      tpl({ id: item().id, cls: item.bindSelectAttr(() => items.selected() === item().id ? 'danger' : '') })
    )
    expect(container.children[0].className).toBe('')
    items.select(2)
    expect(container.children[1].className).toBe('danger')
    expect(container.children[0].className).toBe('')
    items.select(1)
    expect(container.children[0].className).toBe('danger')
    expect(container.children[1].className).toBe('')
  })

  it('placeholder as a style value', () => {
    const tpl = fntemplate(ctx => h('div', { style: { color: ctx('color'), width: '10px' } }))
    const el = tpl({ color: 'red' })
    expect(el.style.color).toBe('red')
    expect(el.style.width).toBe('10px')
  })

  it('placeholder as a bound style value updates when the state changes', () => {
    const s = fnstate('red')
    const tpl = fntemplate(ctx => h('div', { style: { color: ctx('color') } }))
    const el = tpl({ color: s.bindStyle() })
    expect(el.style.color).toBe('red')
    s('blue')
    expect(el.style.color).toBe('blue')
  })

  it('Node value replaces the placeholder', () => {
    const tpl = fntemplate(ctx => h('div', h('span', ctx('child'))))
    const node = h('b', 'bold')
    const el = tpl({ child: node })
    expect(el.querySelector('span').firstChild).toBe(node)
    expect(el.querySelector('span').childNodes.length).toBe(1)
  })

  it('array value is flattened into the placeholder position', () => {
    const tpl = fntemplate(ctx => h('ul', h('li', 'first'), ctx('items'), h('li', 'last')))
    const el = tpl({ items: [h('li', 'a'), 'b', [h('li', 'c')]] })
    expect(el.innerHTML).toBe('<li>first</li><li>a</li>b<li>c</li><li>last</li>')
  })

  it('promise value resolves into the placeholder position', async () => {
    const tpl = fntemplate(ctx => h('div', ctx('later')))
    const el = tpl({ later: Promise.resolve(h('i', 'done')) })
    await flush()
    expect(el.innerHTML).toBe('<i>done</i>')
  })

  it('nested elements with bindings at depth, in document order', () => {
    const tpl = fntemplate(ctx =>
      h('tr', { id: ctx('id'), class: ctx('rowClass'), onclick: ctx('rowClick') },
        h('td', { class: 'col-md-1' }, ctx('id')),
        h('td', { class: 'col-md-4' }, h('a', { class: 'lbl' }, ctx('label'))),
        h('td', { class: 'col-md-1' }, h('a', h('span', { onclick: ctx('removeRow'), class: 'glyphicon' }))),
        h('td', { class: 'col-md-6' }, h('div', h('div', h('em', ctx('deep')))))
      )
    )
    const events = []
    const el = tpl({
      id: 12,
      rowClass: 'danger',
      rowClick: () => events.push('row'),
      label: 'pretty red table',
      removeRow: e => { e.stopPropagation(); events.push('remove') },
      deep: 'deep text'
    })
    expect(el.getAttribute('id')).toBe('12')
    expect(el.className).toBe('danger')
    expect(el.children[0].textContent).toBe('12')
    expect(el.querySelector('a.lbl').textContent).toBe('pretty red table')
    expect(el.querySelector('em').textContent).toBe('deep text')
    el.querySelector('span.glyphicon').click()
    el.click()
    expect(events).toEqual(['remove', 'row'])
  })

  it('bindings after an unbound subtree are still located', () => {
    const tpl = fntemplate(ctx =>
      h('div',
        h('section', h('p', 'static'), h('p', h('b', 'static'))),
        h('section', h('p', ctx('a'))),
        h('footer', { title: ctx('title') })
      )
    )
    const el = tpl({ a: 'A', title: 'T' })
    expect(el.querySelector('section:nth-child(2) p').textContent).toBe('A')
    expect(el.querySelector('footer').getAttribute('title')).toBe('T')
  })

  it('works when the root itself is a placeholder', async () => {
    const s = fnstate('r1')
    const tpl = fntemplate(ctx => ctx('root'))
    expect(tpl({ root: 'plain' }).nodeType).toBe(3)
    expect(tpl({ root: 'plain' }).textContent).toBe('plain')
    const wrapper = h('div', tpl({ root: s.bindAs() }))
    expect(wrapper.textContent).toBe('r1')
    s('r2')
    await flush()
    expect(wrapper.textContent).toBe('r2')
  })

  it('works with no bindings at all', () => {
    const tpl = fntemplate(() => h('div', h('span', 'static')))
    const a = tpl({})
    const b = tpl()
    expect(a.innerHTML).toBe('<span>static</span>')
    expect(b.innerHTML).toBe('<span>static</span>')
    expect(a).not.toBe(b)
  })

  it('template used in bindChildren: removal cleans up subscriptions and selection', async () => {
    const items = fnstate([{ id: 1, label: 'one' }, { id: 2, label: 'two' }, { id: 3, label: 'three' }], o => o.id)
    const tpl = fntemplate(ctx =>
      h('tr', { id: ctx('id'), class: ctx('cls') },
        h('td', h('a', ctx('label'))),
        h('td', h('span', { onclick: ctx('remove') }, 'x'))
      )
    )
    const container = h('tbody')
    items.bindChildren(container, item =>
      tpl({
        id: item().id,
        cls: item.bindSelectAttr(() => items.selected() === item().id ? 'danger' : ''),
        label: item.bindAs(() => item().label),
        remove: () => items(items().filter(d => d.id !== item().id))
      })
    )
    document.body.append(container)
    expect(container.children.length).toBe(3)
    expect(container.children[1].querySelector('a').textContent).toBe('two')
    const bindContext = items._ctx.bindContexts[0]
    expect(bindContext.items.size).toBe(3)
    expect([...bindContext.items.values()].every(it => it.cleanups && it.cleanups.length > 0)).toBe(true)
    expect(Object.keys(items._ctx.selectObservers).length).toBe(3)

    const observersBefore = bindContext.items.get(2).state._ctx.observers.length
    expect(observersBefore).toBeGreaterThan(0)

    // update through the array, like the benchmark's update handler
    items(items().map((it, i) => i === 1 ? { ...it, label: 'two !!!' } : it))
    await flush()
    expect(container.children[1].querySelector('a').textContent).toBe('two !!!')

    items.select(2)
    expect(container.children[1].className).toBe('danger')

    // remove via the template's event handler
    const removed = bindContext.items.get(2).state
    container.children[1].querySelector('span').click()
    expect(container.children.length).toBe(2)
    expect(container.children[0].getAttribute('id')).toBe('1')
    expect(container.children[1].getAttribute('id')).toBe('3')
    expect(bindContext.items.get(2)).toBeUndefined()
    expect(items._ctx.selectObservers[2]).toBeUndefined()
    // the removed item's bindAs subscription was torn down
    expect(removed._ctx.observers.length).toBeLessThan(observersBefore)

    items([])
    expect(container.children.length).toBe(0)
    expect(Object.keys(items._ctx.selectObservers).length).toBe(0)
    container.remove()
  })

  it('does not bind state used directly in the template body', () => {
    const s = fnstate('initial')
    const tpl = fntemplate(() => h('div', s()))
    const el = tpl({})
    expect(el.textContent).toBe('initial')
    s('changed')
    expect(el.textContent).toBe('initial')
  })
})
