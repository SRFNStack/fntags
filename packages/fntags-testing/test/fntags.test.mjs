import { describe, it, expect } from 'vitest'
import * as fntags from '@srfnstack/fntags'
import { h, renderNode, getAttrs, styled, isAttrs } from '@srfnstack/fntags'

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
      null: undefined,
      name: { nameio: 'jello' },
      'http://www.w3.org/1999/xlink:href': null
    }, 'weee')
    expect(el.style.color).toBe('')
    expect(el.getAttribute('data-blue')).toBe('true')
    expect(el.getAttribute('null')).toBe('undefined')
    expect(el.getAttribute('name')).toBe('[object Object]')
    expect(el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('null')
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
