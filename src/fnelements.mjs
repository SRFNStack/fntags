import { h, styled } from './fntags.mjs'

/**
 * @type {(...children: Node[]|Object[])=>HTMLAnchorElement}
 */
export const a = (...children) => h('a', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const abbr = (...children) => h('abbr', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const acronym = (...children) => h('acronym', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const address = (...children) => h('address', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLAreaElement}
 */
export const area = (...children) => h('area', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const article = (...children) => h('article', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const aside = (...children) => h('aside', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLAudioElement}
 */
export const audio = (...children) => h('audio', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const b = (...children) => h('b', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLBaseElement}
 */
export const base = (...children) => h('base', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const bdi = (...children) => h('bdi', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const bdo = (...children) => h('bdo', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const big = (...children) => h('big', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLQuoteElement}
 */
export const blockquote = (...children) => h('blockquote', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLBodyElement}
 */
export const body = (...children) => h('body', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLBRElement}
 */
export const br = (...children) => h('br', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLButtonElement}
 */
export const button = (...children) => h('button', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLCanvasElement}
 */
export const canvas = (...children) => h('canvas', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTableCaptionElement}
 */
export const caption = (...children) => h('caption', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const cite = (...children) => h('cite', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const code = (...children) => h('code', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTableColElement}
 */
export const col = (...children) => h('col', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTableColElement}
 */
export const colgroup = (...children) => h('colgroup', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLDataElement}
 */
export const data = (...children) => h('data', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLDataListElement}
 */
export const datalist = (...children) => h('datalist', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const dd = (...children) => h('dd', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLModElement}
 */
export const del = (...children) => h('del', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLDetailsElement}
 */
export const details = (...children) => h('details', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const dfn = (...children) => h('dfn', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLDialogElement}
 */
export const dialog = (...children) => h('dialog', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLDirectoryElement}
 */
export const dir = (...children) => h('dir', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLDivElement}
 */
export const div = (...children) => h('div', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLDListElement}
 */
export const dl = (...children) => h('dl', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const dt = (...children) => h('dt', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const em = (...children) => h('em', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLEmbedElement}
 */
export const embed = (...children) => h('embed', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLFieldSetElement}
 */
export const fieldset = (...children) => h('fieldset', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const figcaption = (...children) => h('figcaption', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const figure = (...children) => h('figure', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLDivElement}
 */
export const flexCol = (...children) => styled(
  {
    display: 'flex',
    'flex-direction': 'column'
  },
  'div',
  children
)

/**
 * @type {(...children: Node[]|Object[])=>HTMLDivElement}
 */
export const flexCenteredCol = (...children) => styled(
  {
    display: 'flex',
    'flex-direction': 'column',
    'align-items': 'center'
  },
  'div',
  children
)

/**
 * @type {(...children: Node[]|Object[])=>HTMLDivElement}
 */
export const flexRow = (...children) => styled(
  {
    display: 'flex',
    'flex-direction': 'row'
  },
  'div',
  children
)

/**
 * @type {(...children: Node[]|Object[])=>HTMLDivElement}
 */
export const flexCenteredRow = (...children) => styled(
  {
    display: 'flex',
    'flex-direction': 'row',
    'align-items': 'center'
  },
  'div',
  children
)

/**
 * @type {(...children: Node[]|Object[])=>HTMLFontElement}
 */
export const font = (...children) => h(font, ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const footer = (...children) => h('footer', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLFormElement}
 */
export const form = (...children) => h('form', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLFrameElement}
 */
export const frame = (...children) => h('frame', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLFrameSetElement}
 */
export const frameset = (...children) => h('frameset', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLHeadingElement}
 */
export const h1 = (...children) => h('h1', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLHeadingElement}
 */
export const h2 = (...children) => h('h2', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLHeadingElement}
 */
export const h3 = (...children) => h('h3', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLHeadingElement}
 */
export const h4 = (...children) => h('h4', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLHeadingElement}
 */
export const h5 = (...children) => h('h5', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLHeadingElement}
 */
export const h6 = (...children) => h('h6', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLHeadElement}
 */
export const head = (...children) => h('head', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const header = (...children) => h('header', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const hgroup = (...children) => h('hgroup', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLHRElement}
 */
export const hr = (...children) => h('hr', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLHtmlElement}
 */
export const html = (...children) => h('html', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const i = (...children) => h('i', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLIFrameElement}
 */
export const iframe = (...children) => h('iframe', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLImageElement}
 */
export const img = (...children) => h('img', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLInputElement}
 */
export const input = (...children) => h('input', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLModElement}
 */
export const ins = (...children) => h('ins', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const kbd = (...children) => h('kbd', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLLabelElement}
 */
export const label = (...children) => h('label', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLLegendElement}
 */
export const legend = (...children) => h('legend', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLLIElement}
 */
export const li = (...children) => h('li', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLLinkElement}
 */
export const link = (...children) => h('link', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const main = (...children) => h('main', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLMapElement}
 */
export const map = (...children) => h('map', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const mark = (...children) => h('mark', ...children)

/**
 * The best html element for every occasion.
 * @type {(...children: Node[]|Object[])=>HTMLMarqueeElement}
 */
export const marquee = (...children) => h('marquee', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLMenuElement}
 */
export const menu = (...children) => h('menu', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLMetaElement}
 */
export const meta = (...children) => h('meta', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLMeterElement}
 */
export const meter = (...children) => h('meter', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const nav = (...children) => h('nav', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const noframes = (...children) => h('noframes', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const noscript = (...children) => h('noscript', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLObjectElement}
 */
export const object = (...children) => h('object', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLOListElement}
 */
export const ol = (...children) => h('ol', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLOptGroupElement}
 */
export const optgroup = (...children) => h('optgroup', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLOptionElement}
 */
export const option = (...children) => h('option', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLOutputElement}
 */
export const output = (...children) => h('output', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLParagraphElement}
 */
export const p = (...children) => h('p', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLParamElement}
 */
export const param = (...children) => h('param', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLPictureElement}
 */
export const picture = (...children) => h('picture', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLPreElement}
 */
export const pre = (...children) => h('pre', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLProgressElement}
 */
export const progress = (...children) => h('progress', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLQuoteElement}
 */
export const q = (...children) => h('q', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const rp = (...children) => h('rp', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const rt = (...children) => h('rt', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const ruby = (...children) => h('ruby', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const s = (...children) => h('s', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const samp = (...children) => h('samp', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLScriptElement}
 */
export const script = (...children) => h('script', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const section = (...children) => h('section', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLSelectElement}
 */
export const select = (...children) => h('select', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLSlotElement}
 */
export const slot = (...children) => h('slot', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const small = (...children) => h('small', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLSourceElement}
 */
export const source = (...children) => h('source', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLSpanElement}
 */
export const span = (...children) => h('span', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const strong = (...children) => h('strong', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLStyleElement}
 */
export const style = (...children) => h('style', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const sub = (...children) => h('sub', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const summary = (...children) => h('summary', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const sup = (...children) => h('sup', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTableElement}
 */
export const table = (...children) => h('table', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTableSectionElement}
 */
export const tbody = (...children) => h('tbody', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTableDataCellElement}
 */
export const td = (...children) => h('td', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTemplateElement}
 */
export const template = (...children) => h('template', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTextAreaElement}
 */
export const textarea = (...children) => h('textarea', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTableSectionElement}
 */
export const tfoot = (...children) => h('tfoot', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTableHeaderCellElement}
 */
export const th = (...children) => h('th', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTableSectionElement}
 */
export const thead = (...children) => h('thead', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTimeElement}
 */
export const time = (...children) => h('time', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTitleElement}
 */
export const title = (...children) => h('title', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTableRowElement}
 */
export const tr = (...children) => h('tr', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLTrackElement}
 */
export const track = (...children) => h('track', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const tt = (...children) => h('tt', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const u = (...children) => h('u', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLUListElement}
 */
export const ul = (...children) => h('ul', ...children)

/**
 * name conflicts with js syntax
 *
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const var_ = (...children) => h('var', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLVideoElement}
 */
export const video = (...children) => h('video', ...children)

/**
 * @type {(...children: Node[]|Object[])=>HTMLElement}
 */
export const wbr = (...children) => h('wbr', ...children)
