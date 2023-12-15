import * as s from '../../docs/lib/svgelements.mjs'

describe('svgelements', () => {
  it('should create elements with the proper namespaces and tags', () => {
    // name conflicts are resolved by appending _
    const tags = ['a', 'circle', 'clipPath', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'foreignObject', 'g', 'image', 'line', 'linearGradient', 'marker', 'mask', 'metadata', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'script', 'stop', 'style', 'svg', 'switch', 'symbol', 'text', 'textPath', 'title', 'tspan', 'use', 'view']
    for (const tag of tags) {
      const el = s[tag] ? s[tag]() : s[tag + '_']()
      expect(el.namespaceURI).to.eq('http://www.w3.org/2000/svg')
      expect(el.tagName).to.eq(tag)
    }
  })
})
