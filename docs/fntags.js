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
    if( !isNode( root ) ) throw 'The first argument to fnapp must be either a string element id or an element'
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
 *          This function receives two arguments, the parent element and the new state.
 *
 *          If passing a dom node/element, then you must also supply an update function to perform the update on the element.
 *          This is the preferred method for inputs as it ensures the element is not re-created and focus is lost.
 *
 *          Other inputs are not allowed
 *
 *          Avoid changing the bound state unconditionally in either update case as it can cause an infinite update loop.
 *
 * @param update A function to perform a manual update with.
 *          This function receives three arguments. The element, the new state, and the parent element.
 */
export const fnbind = ( state, element, update ) => {
    if( typeof element !== 'function' && !isNode( element ) ) throw 'You can only bind functions and Elements to state changes.'
    if( isNode( element ) && typeof update !== 'function' ) throw 'You must supply an update function when binding directly to an element'
    const states = Array.isArray( state ) && state || [ state ]
    const el = states.reduce( ( el, st ) => {
                                  if( !isfnstate( st ) ) throw `State object: ${st} has not been initialized. Call fntags.initState() with this object and pass the returned value to fnbind.`
                                  st._fn_state_info.addObserver( el, marker(), element, update )
                                  return el
                              },
                              { current: marker() }
    )
    return ( parent ) => {
        el.parent = parent
        el.current = typeof element === 'function' ? renderElement( element( state, parent ), parent ) : element
        return el.current
    }
}

/**
 * Create a state object that can be bound to.
 * @param state The initial state
 * @returns A proxy that notifies watchers when properties are set
 */
export const fnstate = ( state ) => {
    if( typeof state !== 'object' ) throw 'initState must be called with an object. Primitive values are not supported.'
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

    const addObserver = ( el, parent, element, update ) => {
        tagElement( el )
        observers.push( ( state ) => {
            const newElement = update ? update( el.current, state, parent ) : renderElement( element( parent, state ), parent )
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
 * functions are executed with the parent element as the argument. This allows deferring element creation until the parent exists.
 * The value returned must be a dom node/element or string.
 * @param el The element to render
 * @param parent The parent element this element will be attached to. This is passed as the only argument to a function element
 */
export const renderElement = ( el, parent ) => {
    if( typeof el != 'string' && !el ) {
        throw `Child Element is undefined for parent ${parent ? parent.outerHTML : 'root'}`
    }
    if( typeof el === 'string' )
        return document.createTextNode( el )
    else if( typeof el === 'function' ) {
        const element = el( parent )
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
          `is not supported. All elements must be one of or an array of [String, Function, Element, HTMLElement]`
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
 * A router element that marks the root of a routed application. All routes must be descendents of a router.
 * This elements primary purpose is to provide a to to determine the correct path for each route. It accomplishes this by ensuring the children are fully
 * constructed, and then kicking the pathState to ensure that each route has the correct view into it's current path.
 *
 * This element also let's you specify what the root path of your app is. If non is provided, the initial path where this page was loaded is assumed to be the root path.
 * This is probably wrong in most cases but useful in some simple scenarios.
 * You SHOULD set an appropriate root path for your application to ensure correct behavior
 * @returns {HTMLDivElement}
 */
export const router = ( ...children ) => {
    const attrs = shiftAttrs( children )

    if( attrs.rootPath ) pathState.rootPath = ensureSlash( attrs.rootPath )

    let router = div( attrs, ...children )
    pathState.currentPath = pathState.rootPath

    return router
}

/**
 * An element that is displayed only if the the current window location matches this elements full path. The path is derived from this elements path plus any parent paths.
 * All routes must be descendents of a router element.
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
        throw 'a route must have an fnpath attribute and it must be a string'
    }
    const theDataz = div( attrs, ...children )
    return fnbind( pathState, ( st, parent ) => shouldDisplayRoute( parent, attrs ) ? theDataz : marker( attrs ) )
}

/**
 * A link component that is a link to another route in this single page app
 * @param children The attributes of the anchor element and any children
 */
export const fnlink = ( ...chilrdren ) => {
    const attrs = shiftAttrs( chilrdren )
    if( !attrs.to || typeof attrs.to != 'string' ) throw 'links must have a to attribute and it must be a string'

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
 * A function to navigate to the specified path
 * @param path
 */
export const goTo = ( path ) => {
    let newPath = window.location.origin + pathState.rootPath + ensureSlash( path )
    window.history.pushState( {}, path, newPath )
    pathState.currentPath = newPath
}

/**
 * An element that only renders the first route that matches and updates when the route is changed
 * The primary purpose of this element is to provide catchall routes for not found pages and path variables
 * @param children
 */
export const routeSwitch = ( ...children ) =>
    fnbind( pathState, div( shiftAttrs( children ) ),
            ( el ) => {
                while( el.firstChild ) {
                    el.removeChild( el.firstChild )
                }
                for( let child of children ) {
                    const rendered = renderElement( child, el )
                    if( shouldDisplayRoute( el, rendered ) ) {
                        el.append( rendered )
                        return
                    }
                }
            }
    )

const ensureSlash = ( part ) => {
    part = part.startsWith( '/' ) ? part : '/' + part
    return part.endsWith( '/' ) ? part.slice( 0, -1 ) : part
}

const findFullPath = ( node, parts = [] ) => {
    if( node.hasOwnProperty( 'fnpath' ) ) parts.push( parts )
    if( node.parentNode ) findFullPath( node.parentNode, parts )
    return ensureSlash( pathState.rootPath + ensureSlash( parts.reverse().map( ensureSlash ).join( '' ) ) )
}

const pathState = fnstate(
    {
        rootPath: ensureSlash( window.location.pathname ),
        currentPath: ''
    } )
window.addEventListener( 'popstate', () => pathState.currentPath = window.location.pathname )

const shouldDisplayRoute = ( parent, attrs ) => {
    let fullPath = findFullPath( parent, [ isNode( attrs ) ? attrs.getAttribute( 'fnpath' ) : attrs.fnpath ] )
    const isAbsolute = !!( attrs.absolute )
    const currPath = window.location.pathname
    if( isAbsolute ) {
        return currPath === fullPath || currPath === (fullPath + '/')
    } else {
        const pattern = fullPath.replace( /^(.*)\/([^\/]*)$/, '$1/?$2' )
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
export const shiftAttrs = ( args ) => typeof args[ 0 ] === 'object' && !isNode( args[ 0 ] ) ? args.shift() : {}

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
 * @type {function(...[*]=): HTMLAppletElement}
 */
export const applet = htmlElement( 'applet' )


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
 * @type {function(...[*]=): HTMLBaseFontElement}
 */
export const basefont = htmlElement( 'basefont' )


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
export const center = htmlElement( 'center' )


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
 * @type {function(...[*]=): HTMLDirectoryElement}
 */
export const dir = htmlElement( 'dir' )


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
 * @type {function(...[*]=): HTMLFontElement}
 */
export const font = htmlElement( 'font' )


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
 * @type {function(...[*]=): HTMLMarqueeElement}
 */
export const marquee = htmlElement( 'marquee' )

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
export const s = htmlElement( 's' )


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
export const strike = htmlElement( 'strike' )


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
 * @type {function(...[*]=): HTMLElement}
 */
export const u = htmlElement( 'u' )


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