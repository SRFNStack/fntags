import { describe, it, expect } from 'vitest'
import * as fntags from '@srfnstack/fntags'
import { h, renderNode, getAttrs, styled, isAttrs, fnstate } from '@srfnstack/fntags'

describe('h', () => {
  it('should create an element with the passed in tag', () => {
    const e = h('div')
    expect(e.tagName).toBe('DIV')
  })

  it('should set the namespace if specified in the tag', () => {
    const e = h('http://www.w3.org/2000/svg:svg')
    expect(e.namespaceURI).toBe('http://www.w3.org/2000/svg')
    expect(e.tagName).toBe('svg')
  })

  it('should use the first non-node object arg as attributes', () => {
    const e = h('div', { id: 'jerry' })
    expect(e.id).toBe('jerry')
  })

  it('should not use null as attributes', () => {
    const e = h('div', null)
    expect(e.id).toBe('')
  })

  it('should not use undefined as attributes', () => {
    const e = h('div', undefined)
    expect(e.id).toBe('')
  })

  it('should not use arrays as attributes', () => {
    const e = h('div', [{ id: 'jerry' }])
    expect(e.id).toBe('')
  })

  it('should not use promises as attributes', () => {
    const p = Promise.resolve()
    p.id = 'jerry'
    const e = h('div', p)
    expect(e.id).toBe('')
  })

  it('should not use dom nodes as attributes', () => {
    const e = h('div', h('div', { id: 'jerry' }))
    expect(e.id).toBe('')
  })

  it('should initialize bound attributes', () => {
    const fn = () => 'jerry'
    fn.isBoundAttribute = true
    let initEl
    fn.init = (attrName, element) => {
      expect(attrName).toBe('name')
      expect(element.tagName).toBe('DIV')
      initEl = element
    }
    const e = h('div', { name: fn })
    expect(e.getAttribute('name')).toBe('jerry')
    expect(e).toBe(initEl)
  })

  it('should append all the children passed and expand arrays', () => {
    const el = h('div',
      h('div'),
      [h('div'), h('div'), h('div')],
      h('div'),
      h('div'),
      [h('div'), h('div'), h('div')],
      h('div'))
    expect(el.children.length).toBe(10)
  })

  it('should convert bad data to text and include any strings', () => {
    const el = h('div', '1', null, '2', undefined, '3', {}, '4')
    expect(el.innerText).toBe('1null2undefined3[object Object]4')
  })

  it('should set the attribute and element property for value', () => {
    const el = h('input', { value: 'taco' })
    expect(el.value).toBe('taco')
    expect(el.getAttribute('value')).toBe('taco')
  })

  it('should set disabled, checked, and selected as booleans on the element', () => {
    const el = h('input', { disabled: true, checked: true, selected: true })
    expect(el.disabled).toBe(true)
    expect(el.checked).toBe(true)
    expect(el.selected).toBe(true)
  })

  it('should set string and number types as attributes', () => {
    const el = h('input', { id: 1, name: 'taco' })
    expect(el.getAttribute('id')).toBe('1')
    expect(el.getAttribute('name')).toBe('taco')
  })

  it('should set namespaced attributes as ns attributes', () => {
    const el = h('input', { 'http://www.w3.org/1999/xlink:href': '/foo/bar' })
    expect(el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('/foo/bar')
  })

  it('should use a style string correctly', () => {
    const el = h('marquee', {
      style: 'color: blue; font-size:50px; border:2px;'
    }, 'weee')
    expect(el.style.color).toBe('blue')
    expect(el.style.fontSize).toBe('50px')
    expect(el.style.border).toBe('2px')
  })

  it('should use a style object correctly', () => {
    const el = h('marquee', {
      style: {
        color: 'blue',
        'font-size': '50px',
        border: '2px'
      }
    }, 'weee')
    expect(el.style.color).toBe('blue')
    expect(el.style['font-size']).toBe('50px')
    expect(el.style.border).toBe('2px')
  })

  it('should initialize bound styles', () => {
    const fn = () => 'blue'
    fn.isBoundStyle = true
    fn.init = (style, element) => {
      expect(style).toBe('color')
      expect(element.tagName).toBe('MARQUEE')
    }
    const el = h('marquee', {
      style: {
        color: fn,
        'font-size': '50px',
        border: '2px'
      }
    }, 'weee')
    expect(el.style.color).toBe('blue')
    expect(el.style['font-size']).toBe('50px')
    expect(el.style.border).toBe('2px')
  })

  it('should add an event listener when the attr is a function and the attr name starts with on', () => {
    let clicked = false
    const fn = () => { clicked = true }
    const el = h('marquee', { onclick: fn }, 'weee')
    el.click()
    expect(clicked).toBe(true)
  })

  it('should set weird values as attributes', () => {
    const el = h('marquee', {
      style: { color: null },
      'data-blue': true,
      'data-false': false,
      'data-zero': 0,
      name: { nameio: 'jello' }
    }, 'weee')
    expect(el.style.color).toBe('')
    expect(el.getAttribute('data-blue')).toBe('true')
    expect(el.getAttribute('data-false')).toBe('false')
    expect(el.getAttribute('data-zero')).toBe('0')
    expect(el.getAttribute('name')).toBe('[object Object]')
  })

  it('treats null, undefined and empty string attribute values as no attribute', () => {
    const el = h('marquee', {
      null: undefined,
      title: null,
      class: '',
      'http://www.w3.org/1999/xlink:href': null
    }, 'weee')
    expect(el.hasAttribute('null')).toBe(false)
    expect(el.hasAttribute('title')).toBe(false)
    expect(el.hasAttribute('class')).toBe(false)
    expect(el.hasAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe(false)
    expect(el.outerHTML).toBe('<marquee>weee</marquee>')
  })

  it('keeps value and boolean attributes out of the empty value rule', () => {
    const el = h('input', { value: '', disabled: '', checked: null })
    expect(el.hasAttribute('value')).toBe(true)
    expect(el.value).toBe('')
    expect(el.disabled).toBe(false)
    expect(el.checked).toBe(false)
  })

  it('removes a bound attribute when it becomes empty and sets it again when it does not', () => {
    const selected = fnstate(false)
    const el = h('tr', { id: 'r', class: selected.bindAttr(s => s ? 'danger' : '') })
    expect(el.hasAttribute('class')).toBe(false)
    selected(true)
    expect(el.getAttribute('class')).toBe('danger')
    selected(false)
    expect(el.hasAttribute('class')).toBe(false)
    expect(el.outerHTML).toBe('<tr id="r"></tr>')
    selected(true)
    expect(el.className).toBe('danger')
  })

  it('removes a namespaced bound attribute when it becomes empty', () => {
    const href = fnstate('/a')
    const el = h('http://www.w3.org/2000/svg:use', { 'http://www.w3.org/1999/xlink:href': href.bindAttr() })
    expect(el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('/a')
    href(null)
    expect(el.hasAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe(false)
    href('/b')
    expect(el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('/b')
  })

  it('sets boolean attributes as properties, including false', () => {
    const el = h('input', { disabled: false, checked: 'yes', hidden: 0, required: 1 })
    expect(el.disabled).toBe(false)
    expect(el.hasAttribute('disabled')).toBe(false)
    expect(el.checked).toBe(true)
    expect(el.hidden).toBe(false)
    expect(el.required).toBe(true)
  })

  it('sets value last regardless of its position in the attributes object', () => {
    const names = []
    const spy = vi.spyOn(Element.prototype, 'setAttribute').mockImplementation(function (name, value) {
      names.push(name)
      return Element.prototype.getAttribute.call(this, name)
    })
    try {
      h('input', { value: '150', type: 'range', min: '0', max: '200' })
    } finally {
      spy.mockRestore()
    }
    expect(names).toEqual(['type', 'min', 'max', 'value'])
    const el = h('input', { value: 'v', type: 'text', name: 'n' })
    expect(el.value).toBe('v')
    expect(el.getAttribute('value')).toBe('v')
  })

  it('evaluates plain function attribute values and adds listeners for on* functions', () => {
    let clicks = 0
    const el = h('button', { title: () => 'computed', onclick: () => clicks++ },
      h('span', { onclick: () => clicks++ }, 'x'))
    expect(el.getAttribute('title')).toBe('computed')
    el.click()
    expect(clicks).toBe(1)
    el.firstChild.click()
    expect(clicks).toBe(3)
  })

  it('does not treat a non function on* attribute as a listener', () => {
    const el = h('div', { onclick: 'alert(1)' })
    expect(el.getAttribute('onclick')).toBe('alert(1)')
  })
})

describe('h children', () => {
  it('renders a single empty string child as an empty text node', () => {
    const el = h('div', '')
    expect(el.childNodes.length).toBe(1)
    expect(el.firstChild.nodeType).toBe(3)
    expect(el.textContent).toBe('')
  })

  it('renders 0 and other numbers as text', () => {
    expect(h('div', 0).textContent).toBe('0')
    expect(h('div', 0).childNodes.length).toBe(1)
    expect(h('div', { id: 'n' }, 1.5).textContent).toBe('1.5')
    expect(h('div', 'a', 0, 'b').textContent).toBe('a0b')
  })

  it('renders a single string child as one text node', () => {
    const el = h('p', { class: 'c' }, 'hello')
    expect(el.childNodes.length).toBe(1)
    expect(el.firstChild.nodeType).toBe(3)
    expect(el.outerHTML).toBe('<p class="c">hello</p>')
  })

  it('renders null, undefined and booleans as text', () => {
    expect(h('div', null).textContent).toBe('null')
    expect(h('div', undefined).textContent).toBe('undefined')
    expect(h('div', true, false).textContent).toBe('truefalse')
    expect(h('div', 'a', null, undefined).childNodes.length).toBe(3)
  })

  it('flattens nested arrays at any depth in order', () => {
    const el = h('ul', [h('li', 'a'), [h('li', 'b'), [[h('li', 'c')], 'd']], 'e'], h('li', 'f'))
    expect(el.textContent).toBe('abcdef')
    expect(el.querySelectorAll('li').length).toBe(4)
    expect(el.childNodes.length).toBe(6)
  })

  it('renders an empty array child as nothing', () => {
    const el = h('div', [], 'x', [[]])
    expect(el.childNodes.length).toBe(1)
    expect(el.textContent).toBe('x')
  })

  it('evaluates function children and appends their result', () => {
    const el = h('div', () => h('b', 'x'), () => 'y', () => 2, () => null, () => [h('i', 'z'), 'w'])
    expect(el.innerHTML).toBe('<b>x</b>y2null<i>z</i>w')
  })

  it('stringifies a function child that returns a plain object', () => {
    expect(h('div', () => ({})).textContent).toBe('[object Object]')
  })

  it('renders a fnstate child as its current value', () => {
    const s = fnstate('now')
    expect(h('div', s).textContent).toBe('now')
  })

  it('renders a promise child as a hidden marker that is replaced on resolve', async () => {
    const el = h('div', 'a', Promise.resolve(h('b', 'x')), 'c')
    const marker = el.querySelector('.fntags-promise-marker')
    expect(marker).not.toBeNull()
    expect(marker.style.display).toBe('none')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(el.innerHTML).toBe('a<b>x</b>c')
  })

  it('creates namespaced elements from a namespace:tag string with nested children', () => {
    const svg = h('http://www.w3.org/2000/svg:svg', { viewBox: '0 0 1 1' },
      h('http://www.w3.org/2000/svg:circle', { r: 1 }), 'txt')
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')
    expect(svg.getAttribute('viewBox')).toBe('0 0 1 1')
    expect(svg.firstChild.namespaceURI).toBe('http://www.w3.org/2000/svg')
    expect(svg.firstChild.tagName).toBe('circle')
    expect(svg.firstChild.getAttribute('r')).toBe('1')
    expect(svg.lastChild.textContent).toBe('txt')
  })

  it('uses the attributes object only when it is the first child', () => {
    const el = h('div', 'a', { id: 'x' })
    expect(el.id).toBe('')
    expect(el.textContent).toBe('a[object Object]')
  })

  it('does not treat a document fragment or a node as attributes', () => {
    const frag = document.createDocumentFragment()
    frag.append(h('i', 'f'))
    const el = h('div', frag, h('b', 'n'))
    expect(el.innerHTML).toBe('<i>f</i><b>n</b>')
  })
})

describe('renderNode', () => {
  it('assumes a node if it is a truthy object without a then function', () => {
    const o = { id: 1 }
    const n = renderNode(o)
    expect(n).toBe(o)
  })

  it('converts strings and numbers into text nodes', () => {
    const a = renderNode('a')
    const i = renderNode(1)
    expect(a).toBeInstanceOf(Text)
    expect(a.textContent).toBe('a')
    expect(i).toBeInstanceOf(Text)
    expect(i.textContent).toBe('1')
  })

  it('resolves promise results into a node', async () => {
    const el = renderNode(Promise.resolve('hi'))
    expect(el.tagName).toBe('DIV')
    expect(el.style.display).toBe('none')
    // The promise resolves and replaces the placeholder
    const parent = h('div', el)
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(parent.firstChild).toBeInstanceOf(Text)
    expect(parent.firstChild.textContent).toBe('hi')
  })

  it('calls functions and creates nodes from their values', () => {
    const el = renderNode(() => 'hi')
    expect(el).toBeInstanceOf(Text)
    expect(el.textContent).toBe('hi')
  })

  it('turns other stuff into text nodes', () => {
    const el = renderNode(null)
    expect(el).toBeInstanceOf(Text)
    expect(el.textContent).toBe('null')
  })
})

describe('getAttrs', () => {
  it('returns the first element of the passed array if it is an attributes object', () => {
    expect(getAttrs([{ foo: 'bar' }])).toEqual({ foo: 'bar' })
  })

  it('returns empty object for non-attribute values', () => {
    for (const bad of [null, undefined, 'taco', {}, () => {}, 0, NaN, Infinity, []]) {
      expect(getAttrs(bad)).toEqual({})
    }
  })
})

describe('isAttrs', () => {
  it('returns true for plain objects', () => {
    expect(isAttrs({ foo: 'bar' })).toBe(true)
  })

  it('returns false for null, arrays, nodes, and promises', () => {
    expect(isAttrs(null)).toBeFalsy()
    expect(isAttrs(undefined)).toBeFalsy()
    expect(isAttrs([1])).toBe(false)
    expect(isAttrs(h('div'))).toBe(false)
    expect(isAttrs(Promise.resolve())).toBe(false)
  })
})

describe('styled', () => {
  it('adds the style to the element', () => {
    const s = styled({ color: 'blue' }, 'div', [])
    expect(s.style.color).toBe('blue')
  })

  it('adds the style to an element with an existing style', () => {
    const s = styled({ color: 'blue' }, 'div', [{ style: { 'font-size': '10px' } }])
    expect(s.style.color).toBe('blue')
    expect(s.style['font-size']).toBe('10px')
  })

  it('allows overwriting the style', () => {
    const s = styled({ color: 'blue' }, 'div', [{ style: { color: 'purple' } }])
    expect(s.style.color).toBe('purple')
  })
})
