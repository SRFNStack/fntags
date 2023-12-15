import { h } from './fntags.mjs'

/**
 * name conflicts with html a
 *
 * @type {(...children: Node[]|Object[])=>SVGAElement}
 */
export const a_ = (...children) => h('http://www.w3.org/2000/svg:a', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGCircleElement}
 */
export const circle = (...children) => h('http://www.w3.org/2000/svg:circle', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGClipPathElement}
 */
export const clipPath = (...children) => h('http://www.w3.org/2000/svg:clipPath', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGDefsElement}
 */
export const defs = (...children) => h('http://www.w3.org/2000/svg:defs', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGDescElement}
 */
export const desc = (...children) => h('http://www.w3.org/2000/svg:desc', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGEllipseElement}
 */
export const ellipse = (...children) => h('http://www.w3.org/2000/svg:ellipse', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEBlendElement}
 */
export const feBlend = (...children) => h('http://www.w3.org/2000/svg:feBlend', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEColorMatrixElement}
 */
export const feColorMatrix = (...children) => h('http://www.w3.org/2000/svg:feColorMatrix', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEComponentTransferElement}
 */
export const feComponentTransfer = (...children) => h('http://www.w3.org/2000/svg:feComponentTransfer', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFECompositeElement}
 */
export const feComposite = (...children) => h('http://www.w3.org/2000/svg:feComposite', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEConvolveMatrixElement}
 */
export const feConvolveMatrix = (...children) => h('http://www.w3.org/2000/svg:feConvolveMatrix', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEDiffuseLightingElement}
 */
export const feDiffuseLighting = (...children) => h('http://www.w3.org/2000/svg:feDiffuseLighting', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEDisplacementMapElement}
 */
export const feDisplacementMap = (...children) => h('http://www.w3.org/2000/svg:feDisplacementMap', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEDistantLightElement}
 */
export const feDistantLight = (...children) => h('http://www.w3.org/2000/svg:feDistantLight', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEFloodElement}
 */
export const feFlood = (...children) => h('http://www.w3.org/2000/svg:feFlood', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEFuncAElement}
 */
export const feFuncA = (...children) => h('http://www.w3.org/2000/svg:feFuncA', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEFuncBElement}
 */
export const feFuncB = (...children) => h('http://www.w3.org/2000/svg:feFuncB', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEFuncGElement}
 */
export const feFuncG = (...children) => h('http://www.w3.org/2000/svg:feFuncG', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEFuncRElement}
 */
export const feFuncR = (...children) => h('http://www.w3.org/2000/svg:feFuncR', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEGaussianBlurElement}
 */
export const feGaussianBlur = (...children) => h('http://www.w3.org/2000/svg:feGaussianBlur', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEImageElement}
 */
export const feImage = (...children) => h('http://www.w3.org/2000/svg:feImage', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEMergeElement}
 */
export const feMerge = (...children) => h('http://www.w3.org/2000/svg:feMerge', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEMergeNodeElement}
 */
export const feMergeNode = (...children) => h('http://www.w3.org/2000/svg:feMergeNode', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEMorphologyElement}
 */
export const feMorphology = (...children) => h('http://www.w3.org/2000/svg:feMorphology', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEOffsetElement}
 */
export const feOffset = (...children) => h('http://www.w3.org/2000/svg:feOffset', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFEPointLightElement}
 */
export const fePointLight = (...children) => h('http://www.w3.org/2000/svg:fePointLight', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFESpecularLightingElement}
 */
export const feSpecularLighting = (...children) => h('http://www.w3.org/2000/svg:feSpecularLighting', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFESpotLightElement}
 */
export const feSpotLight = (...children) => h('http://www.w3.org/2000/svg:feSpotLight', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFETileElement}
 */
export const feTile = (...children) => h('http://www.w3.org/2000/svg:feTile', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFETurbulenceElement}
 */
export const feTurbulence = (...children) => h('http://www.w3.org/2000/svg:feTurbulence', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGFilterElement}
 */
export const filter = (...children) => h('http://www.w3.org/2000/svg:filter', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGForeignObjectElement}
 */
export const foreignObject = (...children) => h('http://www.w3.org/2000/svg:foreignObject', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGGElement}
 */
export const g = (...children) => h('http://www.w3.org/2000/svg:g', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGImageElement}
 */
export const image = (...children) => h('http://www.w3.org/2000/svg:image', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGLineElement}
 */
export const line = (...children) => h('http://www.w3.org/2000/svg:line', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGLinearGradientElement}
 */
export const linearGradient = (...children) => h('http://www.w3.org/2000/svg:linearGradient', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGMarkerElement}
 */
export const marker = (...children) => h('http://www.w3.org/2000/svg:marker', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGMaskElement}
 */
export const mask = (...children) => h('http://www.w3.org/2000/svg:mask', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGMetadataElement}
 */
export const metadata = (...children) => h('http://www.w3.org/2000/svg:metadata', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGPathElement}
 */
export const path = (...children) => h('http://www.w3.org/2000/svg:path', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGPatternElement}
 */
export const pattern = (...children) => h('http://www.w3.org/2000/svg:pattern', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGPolygonElement}
 */
export const polygon = (...children) => h('http://www.w3.org/2000/svg:polygon', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGPolylineElement}
 */
export const polyline = (...children) => h('http://www.w3.org/2000/svg:polyline', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGRadialGradientElement}
 */
export const radialGradient = (...children) => h('http://www.w3.org/2000/svg:radialGradient', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGRectElement}
 */
export const rect = (...children) => h('http://www.w3.org/2000/svg:rect', ...children)

/**
 * name conflicts with html script
 *
 * @type {(...children: Node[]|Object[])=>SVGScriptElement}
 */
export const script_ = (...children) => h('http://www.w3.org/2000/svg:script', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGStopElement}
 */
export const stop = (...children) => h('http://www.w3.org/2000/svg:stop', ...children)

/**
 * name conflicts with html style
 *
 * @type {(...children: Node[]|Object[])=>SVGStyleElement}
 */
export const style_ = (...children) => h('http://www.w3.org/2000/svg:style', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGElement}
 */
export const svg = (...children) => h('http://www.w3.org/2000/svg:svg', ...children)

/**
 * name conflicts with js syntax
 *
 * @type {(...children: Node[]|Object[])=>SVGSwitchElement}
 */
export const switch_ = (...children) => h('http://www.w3.org/2000/svg:switch', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGSymbolElement}
 */
export const symbol = (...children) => h('http://www.w3.org/2000/svg:symbol', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGTextElement}
 */
export const text = (...children) => h('http://www.w3.org/2000/svg:text', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGTextPathElement}
 */
export const textPath = (...children) => h('http://www.w3.org/2000/svg:textPath', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGTitleElement}
 */
export const title = (...children) => h('http://www.w3.org/2000/svg:title', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGTSpanElement}
 */
export const tspan = (...children) => h('http://www.w3.org/2000/svg:tspan', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGUseElement}
 */
export const use = (...children) => h('http://www.w3.org/2000/svg:use', ...children)

/**
 * @type {(...children: Node[]|Object[])=>SVGViewElement}
 */
export const view = (...children) => h('http://www.w3.org/2000/svg:view', ...children)
