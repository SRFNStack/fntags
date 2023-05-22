import * as h from '../../docs/lib/fnelements.mjs'

describe('fnelements', () => {
  it('should create a div with the text hi', () => {
    const d = h.div('hi')
    expect(d.tagName).to.eq('DIV')
    expect(d.innerText).to.eq('hi')
  })
  it('should create the right tag for every kind of standard html element', () => {
    const tags = ['a', 'abbr', 'acronym', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'big', 'blockquote', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'marquee', 'menu', 'meta', 'meter', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'ul', 'var', 'video', 'wbr']
    for (const tag of tags) {
      const el = h[tag] ? h[tag]() : h[tag + '_']()
      expect(el.tagName).to.eq(tag.toUpperCase())
    }
  })
  it('should create a div with the right style for a flex row', () => {
    const el = h.flexRow('hi')
    expect(el.tagName).to.eq('DIV')
    expect(el.style.display).to.eq('flex')
    expect(el.style['flex-direction']).to.eq('row')
    expect(el.innerText).to.eq('hi')
  })
  it('should create a div with the right style for a centered flex row', () => {
    const el = h.flexCenteredRow('hi')
    expect(el.tagName).to.eq('DIV')
    expect(el.style.display).to.eq('flex')
    expect(el.style['flex-direction']).to.eq('row')
    expect(el.style['align-items']).to.eq('center')
    expect(el.innerText).to.eq('hi')
  })
  it('should create a div with the right style for a flex col', () => {
    const el = h.flexCol('hi')
    expect(el.tagName).to.eq('DIV')
    expect(el.style.display).to.eq('flex')
    expect(el.style['flex-direction']).to.eq('column')
    expect(el.innerText).to.eq('hi')
  })
  it('should create a div with the right style for a centered flex col', () => {
    const el = h.flexCenteredCol('hi')
    expect(el.tagName).to.eq('DIV')
    expect(el.style.display).to.eq('flex')
    expect(el.style['flex-direction']).to.eq('column')
    expect(el.style['align-items']).to.eq('center')
    expect(el.innerText).to.eq('hi')
  })
})
