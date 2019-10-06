/**
 * A helper function that will append the given children to the given root element
 * @param root Either an element id string or an element itself
 * @param children The children to append to the root element
 */
export const fnapp = ( root, ...children ) => {
    if( typeof root === 'string' ) {
        root = document.getElementById( root )
        if( !root ) throw `No such element with id ${root}`
    }
    if( !isNode( root ) ) throw 'Invalid root element'
    root.append( ...children.map( c => renderElement( c, root ) ) )
}

/**
 * Check if a value is an dom node
 * @param el
 * @returns {boolean}
 */
export const isNode = ( el ) =>
    el &&
    ( el instanceof Node || el instanceof Element || el.constructor.toString().search( /object HTML.+Element/ ) > -1 )

/**
 * Bind one or more states to the given element.
 * @param state Either a single state object or an array of state objects to watch
 * @param element An element that will be updated whenever the state changes.
 *          If passing a function, the function will be executed on each state change and the returned value will be rendered to a component.
 *          This function receives the new state as it's only argument.
 *
 *          If passing a dom node/element, then you must also supply an update function to perform the update on the element.
 *          This is the preferred method for inputs as it ensures the element is not re-created and focus is lost.
 *
 *          Other inputs are not allowed
 *
 *          Avoid changing the bound state unconditionally in either update case as it can cause an infinite update loop.
 *
 * @param update A function to perform a manual update with.
 *          This function receives two arguments. The element and the new state
 */
export const fnbind = ( state, element, update ) => {
    if( typeof element !== 'function' && !isNode( element ) ) throw 'You can only bind functions and Elements'
    if( isNode( element ) && typeof update !== 'function' ) throw 'You must supply an update function when binding an element'
    const states = Array.isArray( state ) && state || [ state ]
    const el = states.reduce( ( el, st ) => {
                                  if( !isfnstate( st ) ) throw `State: ${st} is not initialized. Use fnstate() to initialize.`
                                  st._fn_state_info.addObserver( el, element, update )
                                  return el
                              },
                              { current: marker() }
    )
    return () => {
        el.current = typeof element === 'function' ? renderElement( element( state ) ) : element
        return el.current
    }
}

/**
 * Create a state object that can be bound to.
 * @param state The initial state
 * @returns A proxy that notifies watchers when properties are set
 */
export const fnstate = ( state ) => {
    if( typeof state !== 'object' ) throw 'initial state must be an object'
    const observers = []
    const notify = ( method ) => ( ...args ) => {
        let result = Reflect[ method ]( ...args )
        for( let observer of observers ) {
            observer( args[ 0 ] )
        }
        return result
    }
    const p = new Proxy( state, {
        set: notify( 'set' ),
        deleteProperty: notify( 'deleteProperty' )
    } )

    const addObserver = ( el, element, update ) => {
        tagElement( el )
        observers.push( ( state ) => {
            const newElement = update ? update( el.current, state ) : renderElement( element( state ) )
            if( newElement && isNode( newElement ) ) {
                if( !isTagged( newElement ) )
                    tagElement( newElement )
                if( getElId( el.current ) !== getElId( newElement ) ) {
                    delete observers[ getElId( el.current ) ]
                    el.current.replaceWith( newElement )
                    el.current = newElement
                }
            }
        } )
    }

    Object.defineProperty( p, '_fn_state_info', {
        value: Object.freeze( { addObserver } ),
        enumerable: false,
        writable: false
    } )

    return p
}

/**
 * render a given value to an element
 * A string value will become a TextNode
 * A dom node/element is returned verbatim
 * A function is executed and the value returned must be a dom node/element or string.
 * This is useful for state binding because there we need to define elements as a function that takes a state so that the state doesn't need to be in scope of the function at run time.
 * @param el The element to render
 */
export const renderElement = ( el ) => {
    if( typeof el != 'string' && !el ) {
        throw `children can't be undefined`
    }
    if( typeof el === 'string' )
        return document.createTextNode( el )
    else if( typeof el === 'function' ) {
        const element = el()
        if( typeof element === 'string' )
            return document.createTextNode( element )
        else if( !isNode( element ) ) badElementType( el )
        return element
    } else if( isNode( el ) )
        return el
    else
        badElementType( el )
}

const badElementType = ( el ) => {
    throw `Element type ${el.constructor && el.constructor.name || typeof el} ` +
          `is not supported. Elements must be one of [String, Function, Element, HTMLElement]`
}

const isfnstate = ( state ) => state.hasOwnProperty( '_fn_state_info' )

let lastId = 0
const fntag = '_fn_element_info'

const tagElement = ( el ) => {
    if( !el.hasOwnProperty( fntag ) ) {
        Object.defineProperty( el, fntag, {
            value: Object.freeze(
                {
                    id: lastId++
                } ),
            enumerable: false,
            writable: false
        } )
    }
}

const getTag = ( el ) => el[ fntag ]
const isTagged = ( el ) => el && el.hasOwnProperty( fntag )
const getElId = ( el ) => isTagged( el ) && getTag( el ).id

/**
 * An element that is displayed only if the the current route starts with elements fnpath attribute.
 *
 * For example,
 *  route({fnpath: "/proc"},
 *      div(
 *          "proc",
 *          div({fnpath: "/cpuinfo"},
 *              "cpuinfo"
 *              )
 *          )
 *      )
 *
 *  You can override this behavior by setting the attribute, absolute to any value
 *
 *  route({fnpath: "/usr"},
 *      div(
 *          "proc",
 *          div({fnpath: "/cpuinfo", absolute: true},
 *              "cpuinfo"
 *              )
 *          )
 *      )
 *
 * @param children The attributes and children of this element.
 * @returns {function(*=)}
 */
export const route = ( ...children ) => {
    const attrs = shiftAttrs( children )
    if( !attrs.fnpath || typeof attrs.fnpath !== 'string' ) {
        throw 'route must have a string fnpath attribute'
    }
    const theDataz = div( attrs, ...children )
    return fnbind( pathState, () => shouldDisplayRoute( attrs ) ? theDataz : marker( attrs ) )
}

/**
 * A link component that is a link to another route in this single page app
 * @param children The attributes of the anchor element and any children
 */
export const fnlink = ( ...chilrdren ) => {
    const attrs = shiftAttrs( chilrdren )
    if( !attrs.to || typeof attrs.to != 'string' ) throw 'fnlink must have a "to" string attribute'

    return () => {
        let oldClick = attrs.onclick
        attrs.onclick = ( e ) => {
            e.preventDefault()
            goTo( attrs.to )
            if( oldClick ) oldClick( e )
        }

        return a( attrs, ...chilrdren )
    }
}

/**
 * A function to navigate to the specified route
 * @param route
 */
export const goTo = ( route ) => {
    let newPath = window.location.origin + pathState.info.rootPath + ensureSlash( route )
    history.pushState( {}, route, newPath )
    pathState.info = Object.assign( pathState.info, { currentRoute: route } )
    if( newPath.indexOf( '#' ) > -1 ) {
        const el = document.getElementById( decodeURIComponent( newPath.split( '#' )[ 1 ] ) )
        el && el.scrollIntoView()
    }
}

/**
 * An element that only renders the first route that matches and updates when the route is changed
 * The primary purpose of this element is to provide catchall routes for not found pages and path variables
 * @param children
 */
export const routeSwitch = ( ...children ) => {
    const sw = div( shiftAttrs( children ) )
    return fnbind( pathState, () => {
                       while( sw.firstChild ) {
                           sw.removeChild( sw.firstChild )
                       }
                       for( let child of children ) {
                           const rendered = renderElement( child )
                           if( shouldDisplayRoute( rendered ) ) {
                               sw.append( rendered )
                               return sw
                           }
                       }
                   }
    )
}

const ensureSlash = ( part ) => {
    part = part.startsWith( '/' ) ? part : '/' + part
    return part.endsWith( '/' ) ? part.slice( 0, -1 ) : part
}

export const pathState = fnstate(
    {
        info: {
            rootPath: ensureSlash( window.location.pathname ),
            currentRoute: '/'
        }
    } )

/**
 * Set the root path of the app
 */
export const setRootPath = (rootPath) => pathState.info = Object.assign(pathState.info, {rootPath: ensureSlash(rootPath), currentRoute: window.location.pathname})

window.addEventListener( 'popstate', () =>
    pathState.info = Object.assign(
        pathState.info, {
            currentRoute: window.location.pathname.replace( pathState.info.rootPath, '' ) || '/'
        }
    )
)

const shouldDisplayRoute = ( attrs ) => {
    let path = pathState.info.rootPath + ensureSlash( isNode( attrs ) ? attrs.getAttribute( 'fnpath' ) : attrs.fnpath )
    const isAbsolute = !!( attrs.absolute )
    const currPath = window.location.pathname
    if( isAbsolute ) {
        return currPath === path || currPath === ( path + '/' )
    } else {
        const pattern = path.replace( /^(.*)\/([^\/]*)$/, '$1/?$2([/?#]|$)' )
        return !!currPath.match( pattern )
    }

}

/**
 * Create a function that will render an actual DomElement with the given attributes and children.
 * @param tag The html tag to use when created the element
 * @returns {function(...[*]=): HTMLElement} A function that accepts an attributes object and an array of children.
 *
 * If the first argument is an object that is not an html element, then it is considered to be the attributes object.
 * All standard html attributes can be passed, as well as any other property.
 * Any attributes that are not strings are added as non-enumerable properties of the element.
 * Event listeners can either be a string or a function.
 *
 * The rest of the arguments will be considered children of this element and appended to it in the same order as passed.
 *
 */
const htmlElement = ( tag ) => ( ...children ) => {
    const attrs = shiftAttrs( children )
    let element = document.createElement( tag )
    if( attrs ) {
        Object.keys( attrs ).forEach( a => {
            let attr = attrs[ a ]
            if( a.startsWith( 'on' ) && typeof attr === 'function' ) {
                element.addEventListener( a.substring( 2 ), attr )
            } else if( typeof attr === 'string' ) {
                element.setAttribute( a, attr )
            } else {
                Object.defineProperty( element, a, {
                    value: attr,
                    enumerable: false
                } )
            }
        } )
    }
    if( children ) element.append( ...children.map( ( c ) => renderElement( c, element ) ) )
    return element
}

/**
 * Use this method to remove the attributes object from an array of arguments or rest parameters.
 *
 * This method shifts the first element from the given array if it is an object and not a dom node/element.
 * If the first element does not meet these conditions, the array is is unmodified and a new empty object is returned instead.
 *
 * @param args The array to remove the attributes from
 * @returns The attributes object or a new object if none was present
 */
export const shiftAttrs = ( args ) => typeof args[ 0 ] === 'object' && !isNode( args[ 0 ] ) ? args.splice(0,1)[0] : {}
/**
 * Similar to shift attrs, but does not modify the array
 * @param args
 * @returns {{}}
 */
export const getAttrs = ( args ) => typeof args[ 0 ] === 'object' && !isNode( args[ 0 ] ) ? args[0] : {}

/**
 * A hidden div node to mark your place in the dom
 * @returns {HTMLDivElement}
 */
export const marker = ( attrs ) => div( Object.assign( attrs || {}, { style: 'display:none' } ) )

/**
 * @type {function(...[*]=): HTMLAnchorElement}
 */
export const a = htmlElement( 'a' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const abbr = htmlElement( 'abbr' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const acronym = htmlElement( 'acronym' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const address = htmlElement( 'address' )

/**
 * @type {function(...[*]=): HTMLAreaElement}
 */
export const area = htmlElement( 'area' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const article = htmlElement( 'article' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const aside = htmlElement( 'aside' )

/**
 * @type {function(...[*]=): HTMLAudioElement}
 */
export const audio = htmlElement( 'audio' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const b = htmlElement( 'b' )

/**
 * @type {function(...[*]=): HTMLBaseElement}
 */
export const base = htmlElement( 'base' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const bdi = htmlElement( 'bdi' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const bdo = htmlElement( 'bdo' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const big = htmlElement( 'big' )

/**
 * @type {function(...[*]=): HTMLQuoteElement}
 */
export const blockquote = htmlElement( 'blockquote' )

/**
 * @type {function(...[*]=): HTMLBRElement}
 */
export const br = htmlElement( 'br' )

/**
 * @type {function(...[*]=): HTMLButtonElement}
 */
export const button = htmlElement( 'button' )

/**
 * @type {function(...[*]=): HTMLCanvasElement}
 */
export const canvas = htmlElement( 'canvas' )

/**
 * @type {function(...[*]=): HTMLTableCaptionElement}
 */
export const caption = htmlElement( 'caption' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const cite = htmlElement( 'cite' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const code = htmlElement( 'code' )

/**
 * @type {function(...[*]=): HTMLTableColElement}
 */
export const col = htmlElement( 'col' )

/**
 * @type {function(...[*]=): HTMLTableColElement}
 */
export const colgroup = htmlElement( 'colgroup' )

/**
 * @type {function(...[*]=): HTMLDataElement}
 */
export const data = htmlElement( 'data' )

/**
 * @type {function(...[*]=): HTMLDataListElement}
 */
export const datalist = htmlElement( 'datalist' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const dd = htmlElement( 'dd' )

/**
 * @type {function(...[*]=): HTMLModElement}
 */
export const del = htmlElement( 'del' )

/**
 * @type {function(...[*]=): HTMLDetailsElement}
 */
export const details = htmlElement( 'details' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const dfn = htmlElement( 'dfn' )

/**
 * @type {function(...[*]=): HTMLDialogElement}
 */
export const dialog = htmlElement( 'dialog' )

/**
 * @type {function(...[*]=): HTMLDivElement}
 */
export const div = htmlElement( 'div' )

/**
 * @type {function(...[*]=): HTMLDListElement}
 */
export const dl = htmlElement( 'dl' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const dt = htmlElement( 'dt' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const em = htmlElement( 'em' )

/**
 * @type {function(...[*]=): HTMLEmbedElement}
 */
export const embed = htmlElement( 'embed' )

/**
 * @type {function(...[*]=): HTMLFieldSetElement}
 */
export const fieldset = htmlElement( 'fieldset' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const figcaption = htmlElement( 'figcaption' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const figure = htmlElement( 'figure' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const footer = htmlElement( 'footer' )

/**
 * @type {function(...[*]=): HTMLFormElement}
 */
export const form = htmlElement( 'form' )

/**
 * @type {function(...[*]=): HTMLFrameElement}
 */
export const frame = htmlElement( 'frame' )

/**
 * @type {function(...[*]=): HTMLFrameSetElement}
 */
export const frameset = htmlElement( 'frameset' )

/**
 * @type {function(...[*]=): HTMLHeadingElement}
 */
export const h1 = htmlElement( 'h1' )

/**
 * @type {function(...[*]=): HTMLHeadingElement}
 */
export const h2 = htmlElement( 'h2' )

/**
 * @type {function(...[*]=): HTMLHeadingElement}
 */
export const h3 = htmlElement( 'h3' )

/**
 * @type {function(...[*]=): HTMLHeadingElement}
 */
export const h4 = htmlElement( 'h4' )

/**
 * @type {function(...[*]=): HTMLHeadingElement}
 */
export const h5 = htmlElement( 'h5' )

/**
 * @type {function(...[*]=): HTMLHeadingElement}
 */
export const h6 = htmlElement( 'h6' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const header = htmlElement( 'header' )

/**
 * @type {function(...[*]=): HTMLHRElement}
 */
export const hr = htmlElement( 'hr' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const i = htmlElement( 'i' )

/**
 * @type {function(...[*]=): HTMLIFrameElement}
 */
export const iframe = htmlElement( 'iframe' )

/**
 * @type {function(...[*]=): HTMLImageElement}
 */
export const img = htmlElement( 'img' )

/**
 * @type {function(...[*]=): HTMLInputElement}
 */
export const input = htmlElement( 'input' )

/**
 * @type {function(...[*]=): HTMLModElement}
 */
export const ins = htmlElement( 'ins' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const kbd = htmlElement( 'kbd' )

/**
 * @type {function(...[*]=): HTMLLabelElement}
 */
export const label = htmlElement( 'label' )

/**
 * @type {function(...[*]=): HTMLLegendElement}
 */
export const legend = htmlElement( 'legend' )

/**
 * @type {function(...[*]=): HTMLLIElement}
 */
export const li = htmlElement( 'li' )

/**
 * @type {function(...[*]=): HTMLLinkElement}
 */
export const link = htmlElement( 'link' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const main = htmlElement( 'main' )

/**
 * @type {function(...[*]=): HTMLMapElement}
 */
export const map = htmlElement( 'map' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const mark = htmlElement( 'mark' )

/**
 * @type {function(...[*]=): HTMLMenuElement}
 */
export const menu = htmlElement( 'menu' )

/**
 * @type {function(...[*]=): HTMLMetaElement}
 */
export const meta = htmlElement( 'meta' )

/**
 * @type {function(...[*]=): HTMLMeterElement}
 */
export const meter = htmlElement( 'meter' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const nav = htmlElement( 'nav' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const noframes = htmlElement( 'noframes' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const noscript = htmlElement( 'noscript' )

/**
 * @type {function(...[*]=): HTMLObjectElement}
 */
export const object = htmlElement( 'object' )

/**
 * @type {function(...[*]=): HTMLOListElement}
 */
export const ol = htmlElement( 'ol' )

/**
 * @type {function(...[*]=): HTMLOptGroupElement}
 */
export const optgroup = htmlElement( 'optgroup' )

/**
 * @type {function(...[*]=): HTMLOptionElement}
 */
export const option = htmlElement( 'option' )

/**
 * @type {function(...[*]=): HTMLOutputElement}
 */
export const output = htmlElement( 'output' )

/**
 * @type {function(...[*]=): HTMLParagraphElement}
 */
export const p = htmlElement( 'p' )

/**
 * @type {function(...[*]=): HTMLParamElement}
 */
export const param = htmlElement( 'param' )

/**
 * @type {function(...[*]=): HTMLPictureElement}
 */
export const picture = htmlElement( 'picture' )

/**
 * @type {function(...[*]=): HTMLPreElement}
 */
export const pre = htmlElement( 'pre' )

/**
 * @type {function(...[*]=): HTMLProgressElement}
 */
export const progress = htmlElement( 'progress' )

/**
 * @type {function(...[*]=): HTMLQuoteElement}
 */
export const q = htmlElement( 'q' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const rp = htmlElement( 'rp' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const rt = htmlElement( 'rt' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const ruby = htmlElement( 'ruby' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const samp = htmlElement( 'samp' )

/**
 * @type {function(...[*]=): HTMLScriptElement}
 */
export const script = htmlElement( 'script' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const section = htmlElement( 'section' )

/**
 * @type {function(...[*]=): HTMLSelectElement}
 */
export const select = htmlElement( 'select' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const small = htmlElement( 'small' )

/**
 * @type {function(...[*]=): HTMLSourceElement}
 */
export const source = htmlElement( 'source' )

/**
 * @type {function(...[*]=): HTMLSpanElement}
 */
export const span = htmlElement( 'span' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const strong = htmlElement( 'strong' )

/**
 * @type {function(...[*]=): HTMLStyleElement}
 */
export const style = htmlElement( 'style' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const sub = htmlElement( 'sub' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const summary = htmlElement( 'summary' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const sup = htmlElement( 'sup' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const svg = htmlElement( 'svg' )

/**
 * @type {function(...[*]=): HTMLTableElement}
 */
export const table = htmlElement( 'table' )

/**
 * @type {function(...[*]=): HTMLTableSectionElement}
 */
export const tbody = htmlElement( 'tbody' )

/**
 * @type {function(...[*]=): HTMLTableDataCellElement}
 */
export const td = htmlElement( 'td' )

/**
 * @type {function(...[*]=): HTMLTemplateElement}
 */
export const template = htmlElement( 'template' )

/**
 * @type {function(...[*]=): HTMLTextAreaElement}
 */
export const textarea = htmlElement( 'textarea' )

/**
 * @type {function(...[*]=): HTMLTableSectionElement}
 */
export const tfoot = htmlElement( 'tfoot' )

/**
 * @type {function(...[*]=): HTMLTableHeaderCellElement}
 */
export const th = htmlElement( 'th' )

/**
 * @type {function(...[*]=): HTMLTableSectionElement}
 */
export const thead = htmlElement( 'thead' )

/**
 * @type {function(...[*]=): HTMLTimeElement}
 */
export const time = htmlElement( 'time' )

/**
 * @type {function(...[*]=): HTMLTitleElement}
 */
export const title = htmlElement( 'title' )

/**
 * @type {function(...[*]=): HTMLTableRowElement}
 */
export const tr = htmlElement( 'tr' )

/**
 * @type {function(...[*]=): HTMLTrackElement}
 */
export const track = htmlElement( 'track' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const tt = htmlElement( 'tt' )

/**
 * @type {function(...[*]=): HTMLUListElement}
 */
export const ul = htmlElement( 'ul' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const _var = htmlElement( 'var' )

/**
 * @type {function(...[*]=): HTMLVideoElement}
 */
export const video = htmlElement( 'video' )

/**
 * @type {function(...[*]=): HTMLElement}
 */
export const wbr = htmlElement( 'wbr' )