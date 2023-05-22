import { h } from './fntags.mjs'

/**
 * name conflicts with html a
 *
 * @type {function(...[*]=): SVGAElement}
 */
export const a_ = (...children) => h('http://www.w3.org/2000/svg:a', ...children)

/**
 * @type {function(...[*]=): SVGCircleElement}
 */
export const circle = (...children) => h('http://www.w3.org/2000/svg:circle', ...children)

/**
 * @type {function(...[*]=): SVGClipPathElement}
 */
export const clipPath = (...children) => h('http://www.w3.org/2000/svg:clipPath', ...children)

/**
 * @type {function(...[*]=): SVGDefsElement}
 */
export const defs = (...children) => h('http://www.w3.org/2000/svg:defs', ...children)

/**
 * @type {function(...[*]=): SVGDescElement}
 */
export const desc = (...children) => h('http://www.w3.org/2000/svg:desc', ...children)

/**
 * @type {function(...[*]=): SVGEllipseElement}
 */
export const ellipse = (...children) => h('http://www.w3.org/2000/svg:ellipse', ...children)

/**
 * @type {function(...[*]=): SVGFEBlendElement}
 */
export const feBlend = (...children) => h('http://www.w3.org/2000/svg:feBlend', ...children)

/**
 * @type {function(...[*]=): SVGFEColorMatrixElement}
 */
export const feColorMatrix = (...children) => h('http://www.w3.org/2000/svg:feColorMatrix', ...children)

/**
 * @type {function(...[*]=): SVGFEComponentTransferElement}
 */
export const feComponentTransfer = (...children) => h('http://www.w3.org/2000/svg:feComponentTransfer', ...children)

/**
 * @type {function(...[*]=): SVGFECompositeElement}
 */
export const feComposite = (...children) => h('http://www.w3.org/2000/svg:feComposite', ...children)

/**
 * @type {function(...[*]=): SVGFEConvolveMatrixElement}
 */
export const feConvolveMatrix = (...children) => h('http://www.w3.org/2000/svg:feConvolveMatrix', ...children)

/**
 * @type {function(...[*]=): SVGFEDiffuseLightingElement}
 */
export const feDiffuseLighting = (...children) => h('http://www.w3.org/2000/svg:feDiffuseLighting', ...children)

/**
 * @type {function(...[*]=): SVGFEDisplacementMapElement}
 */
export const feDisplacementMap = (...children) => h('http://www.w3.org/2000/svg:feDisplacementMap', ...children)

/**
 * @type {function(...[*]=): SVGFEDistantLightElement}
 */
export const feDistantLight = (...children) => h('http://www.w3.org/2000/svg:feDistantLight', ...children)

/**
 * @type {function(...[*]=): SVGFEFloodElement}
 */
export const feFlood = (...children) => h('http://www.w3.org/2000/svg:feFlood', ...children)

/**
 * @type {function(...[*]=): SVGFEFuncAElement}
 */
export const feFuncA = (...children) => h('http://www.w3.org/2000/svg:feFuncA', ...children)

/**
 * @type {function(...[*]=): SVGFEFuncBElement}
 */
export const feFuncB = (...children) => h('http://www.w3.org/2000/svg:feFuncB', ...children)

/**
 * @type {function(...[*]=): SVGFEFuncGElement}
 */
export const feFuncG = (...children) => h('http://www.w3.org/2000/svg:feFuncG', ...children)

/**
 * @type {function(...[*]=): SVGFEFuncRElement}
 */
export const feFuncR = (...children) => h('http://www.w3.org/2000/svg:feFuncR', ...children)

/**
 * @type {function(...[*]=): SVGFEGaussianBlurElement}
 */
export const feGaussianBlur = (...children) => h('http://www.w3.org/2000/svg:feGaussianBlur', ...children)

/**
 * @type {function(...[*]=): SVGFEImageElement}
 */
export const feImage = (...children) => h('http://www.w3.org/2000/svg:feImage', ...children)

/**
 * @type {function(...[*]=): SVGFEMergeElement}
 */
export const feMerge = (...children) => h('http://www.w3.org/2000/svg:feMerge', ...children)

/**
 * @type {function(...[*]=): SVGFEMergeNodeElement}
 */
export const feMergeNode = (...children) => h('http://www.w3.org/2000/svg:feMergeNode', ...children)

/**
 * @type {function(...[*]=): SVGFEMorphologyElement}
 */
export const feMorphology = (...children) => h('http://www.w3.org/2000/svg:feMorphology', ...children)

/**
 * @type {function(...[*]=): SVGFEOffsetElement}
 */
export const feOffset = (...children) => h('http://www.w3.org/2000/svg:feOffset', ...children)

/**
 * @type {function(...[*]=): SVGFEPointLightElement}
 */
export const fePointLight = (...children) => h('http://www.w3.org/2000/svg:fePointLight', ...children)

/**
 * @type {function(...[*]=): SVGFESpecularLightingElement}
 */
export const feSpecularLighting = (...children) => h('http://www.w3.org/2000/svg:feSpecularLighting', ...children)

/**
 * @type {function(...[*]=): SVGFESpotLightElement}
 */
export const feSpotLight = (...children) => h('http://www.w3.org/2000/svg:feSpotLight', ...children)

/**
 * @type {function(...[*]=): SVGFETileElement}
 */
export const feTile = (...children) => h('http://www.w3.org/2000/svg:feTile', ...children)

/**
 * @type {function(...[*]=): SVGFETurbulenceElement}
 */
export const feTurbulence = (...children) => h('http://www.w3.org/2000/svg:feTurbulence', ...children)

/**
 * @type {function(...[*]=): SVGFilterElement}
 */
export const filter = (...children) => h('http://www.w3.org/2000/svg:filter', ...children)

/**
 * @type {function(...[*]=): SVGForeignObjectElement}
 */
export const foreignObject = (...children) => h('http://www.w3.org/2000/svg:foreignObject', ...children)

/**
 * @type {function(...[*]=): SVGGElement}
 */
export const g = (...children) => h('http://www.w3.org/2000/svg:g', ...children)

/**
 * @type {function(...[*]=): SVGImageElement}
 */
export const image = (...children) => h('http://www.w3.org/2000/svg:image', ...children)

/**
 * @type {function(...[*]=): SVGLineElement}
 */
export const line = (...children) => h('http://www.w3.org/2000/svg:line', ...children)

/**
 * @type {function(...[*]=): SVGLinearGradientElement}
 */
export const linearGradient = (...children) => h('http://www.w3.org/2000/svg:linearGradient', ...children)

/**
 * @type {function(...[*]=): SVGMarkerElement}
 */
export const marker = (...children) => h('http://www.w3.org/2000/svg:marker', ...children)

/**
 * @type {function(...[*]=): SVGMaskElement}
 */
export const mask = (...children) => h('http://www.w3.org/2000/svg:mask', ...children)

/**
 * @type {function(...[*]=): SVGMetadataElement}
 */
export const metadata = (...children) => h('http://www.w3.org/2000/svg:metadata', ...children)

/**
 * @type {function(...[*]=): SVGPathElement}
 */
export const path = (...children) => h('http://www.w3.org/2000/svg:path', ...children)

/**
 * @type {function(...[*]=): SVGPatternElement}
 */
export const pattern = (...children) => h('http://www.w3.org/2000/svg:pattern', ...children)

/**
 * @type {function(...[*]=): SVGPolygonElement}
 */
export const polygon = (...children) => h('http://www.w3.org/2000/svg:polygon', ...children)

/**
 * @type {function(...[*]=): SVGPolylineElement}
 */
export const polyline = (...children) => h('http://www.w3.org/2000/svg:polyline', ...children)

/**
 * @type {function(...[*]=): SVGRadialGradientElement}
 */
export const radialGradient = (...children) => h('http://www.w3.org/2000/svg:radialGradient', ...children)

/**
 * @type {function(...[*]=): SVGRectElement}
 */
export const rect = (...children) => h('http://www.w3.org/2000/svg:rect', ...children)

/**
 * name conflicts with html script
 *
 * @type {function(...[*]=): SVGScriptElement}
 */
export const script_ = (...children) => h('http://www.w3.org/2000/svg:script', ...children)

/**
 * @type {function(...[*]=): SVGStopElement}
 */
export const stop = (...children) => h('http://www.w3.org/2000/svg:stop', ...children)

/**
 * name conflicts with html style
 *
 * @type {function(...[*]=): SVGStyleElement}
 */
export const style_ = (...children) => h('http://www.w3.org/2000/svg:style', ...children)

/**
 * @type {function(...[*]=): SVGElement}
 */
export const svg = (...children) => h('http://www.w3.org/2000/svg:svg', ...children)

/**
 * name conflicts with js syntax
 *
 * @type {function(...[*]=): SVGSwitchElement}
 */
export const switch_ = (...children) => h('http://www.w3.org/2000/svg:switch', ...children)

/**
 * @type {function(...[*]=): SVGSymbolElement}
 */
export const symbol = (...children) => h('http://www.w3.org/2000/svg:symbol', ...children)

/**
 * @type {function(...[*]=): SVGTextElement}
 */
export const text = (...children) => h('http://www.w3.org/2000/svg:text', ...children)

/**
 * @type {function(...[*]=): SVGTextPathElement}
 */
export const textPath = (...children) => h('http://www.w3.org/2000/svg:textPath', ...children)

/**
 * @type {function(...[*]=): SVGTitleElement}
 */
export const title = (...children) => h('http://www.w3.org/2000/svg:title', ...children)

/**
 * @type {function(...[*]=): SVGTSpanElement}
 */
export const tspan = (...children) => h('http://www.w3.org/2000/svg:tspan', ...children)

/**
 * @type {function(...[*]=): SVGUseElement}
 */
export const use = (...children) => h('http://www.w3.org/2000/svg:use', ...children)

/**
 * @type {function(...[*]=): SVGViewElement}
 */
export const view = (...children) => h('http://www.w3.org/2000/svg:view', ...children)
