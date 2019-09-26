const htmlElement = ( tag ) => ( ...children ) => {
    const attrs = typeof children[ 0 ] === 'object' && !isNode( children[ 0 ] ) ? children.shift() : {}
    let element = document.createElement( tag )
    if( attrs ) {
        Object.keys( attrs ).forEach( a => {
            let attr = attrs[ a ]
            if( a.startsWith( 'on' ) && typeof attr === 'function' ) {
                element.addEventListener( a.substring( 2 ), attr )
            }
            element.setAttribute( a, attr )
        } )
    }
    if( children ) element.append( ...children.map( ( c ) => renderElement( c ) ) )
    return element
}

let lastId = 0

const badElementType = ( el ) => {
    throw `Element type ${el.constructor && el.constructor.name || typeof el} ` +
          `is not supported. All elements must be one of or an array of [String, Function, Element, HTMLElement]`
}

const isNode = ( el ) => el instanceof Node || el instanceof Element ||
                         el.constructor.toString().search( /object HTML.+Element/ ) > -1

const renderElement = ( el ) => {
    if( el.constructor.name === 'String' )
        return document.createTextNode( el )
    else if( el.constructor.name === 'Function' ) {
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

const tagElement = ( el ) => {
    if( !el.hasOwnProperty( '_fn_element_info' ) ) {
        Object.defineProperty( el, '_fn_element_info', {
            value: Object.freeze(
                {
                    id: lastId++
                } ),
            enumerable: false,
            writable: false
        } )
    }
}
const isTagged = ( el ) => el.hasOwnProperty( '_fn_element_info' )

const getElId = ( el ) => el._fn_element_info.id

export const fntags = {
    hoist() {
        Object.keys( fntags ).forEach( ( key ) => {
            if( window[ key ] ) {
                console.log( `window already has property ${key}. Use _fn_${key} to use this tag.` )
                window[ '_fn_' + key ] = htmlElement( key )
            } else {
                window[ key ] = htmlElement( key )
            }
        } )
    },
    initState( state ) {
        if( typeof state !== 'object' ) throw 'initState must be called with an object. Primitive values are not supported.'
        const observers = {}
        const notify = ( method ) => ( ...args ) => {
            let result = Reflect[ method ]( ...args )
            for( let k in observers ) {
                observers[ k ]( args[ 0 ] )
            }
            return result
        }
        const p = new Proxy( state, {
            set: notify( 'set' ),
            deleteProperty: notify( 'deleteProperty' )
        } )

        const addObserver = ( el, element, update ) => {
            tagElement( el.current )
            observers[ getElId( el.current ) ] = ( state ) => {
                const newElement = update ? update( element, state ) : renderElement( element( state ) )
                if( newElement && isNode( newElement ) && !isTagged( newElement ) ) {
                    tagElement( newElement )
                    delete observers[ getElId( el.current ) ]
                    el.current.replaceWith( newElement )
                    el.current = newElement
                    addObserver( el, element, update )
                }
            }
        }

        Object.defineProperty( p, '_fn_state_info', {
            value: Object.freeze( { addObserver } ),
            enumerable: false,
            writable: false
        } )

        return p
    },
    fnbind( state, element, update ) {
        if( typeof element !== 'function' && !isNode( element ) ) throw 'You can only bind functions and Elements to state changes.'
        if( isNode( element ) && typeof update !== 'function' ) throw 'You must supply an update function when binding directly to an element'

        return ( Array.isArray( state ) && state || [ state ] )
            .reduce( ( el, st ) => {
                         if( !st.hasOwnProperty( '_fn_state_info' ) ) throw `State object: ${st} has not been initialized. Call fntags.initState() with this object and pass the returned value to fnbind.`
                         st._fn_state_info.addObserver( el, element, update )
                         return el
                     },
                     { current: typeof element === 'function' ? renderElement( element( state ) ) : element }
            ).current
    }
}

export const fnbind = fntags.fnbind
export const a = htmlElement( 'a' )
export const abbr = htmlElement( 'abbr' )
export const acronym = htmlElement( 'acronym' )
export const address = htmlElement( 'address' )
export const applet = htmlElement( 'applet' )
export const area = htmlElement( 'area' )
export const article = htmlElement( 'article' )
export const aside = htmlElement( 'aside' )
export const audio = htmlElement( 'audio' )
export const b = htmlElement( 'b' )
export const base = htmlElement( 'base' )
export const basefont = htmlElement( 'basefont' )
export const bdi = htmlElement( 'bdi' )
export const bdo = htmlElement( 'bdo' )
export const big = htmlElement( 'big' )
export const blockquote = htmlElement( 'blockquote' )
export const br = htmlElement( 'br' )
export const button = htmlElement( 'button' )
export const canvas = htmlElement( 'canvas' )
export const caption = htmlElement( 'caption' )
export const center = htmlElement( 'center' )
export const cite = htmlElement( 'cite' )
export const code = htmlElement( 'code' )
export const col = htmlElement( 'col' )
export const colgroup = htmlElement( 'colgroup' )
export const currentUser = htmlElement( 'currentUser' )
export const datalist = htmlElement( 'datalist' )
export const dd = htmlElement( 'dd' )
export const del = htmlElement( 'del' )
export const details = htmlElement( 'details' )
export const dfn = htmlElement( 'dfn' )
export const dialog = htmlElement( 'dialog' )
export const dir = htmlElement( 'dir' )
export const div = htmlElement( 'div' )
export const dl = htmlElement( 'dl' )
export const dt = htmlElement( 'dt' )
export const em = htmlElement( 'em' )
export const embed = htmlElement( 'embed' )
export const fieldset = htmlElement( 'fieldset' )
export const figcaption = htmlElement( 'figcaption' )
export const figure = htmlElement( 'figure' )
export const font = htmlElement( 'font' )
export const footer = htmlElement( 'footer' )
export const form = htmlElement( 'form' )
export const frame = htmlElement( 'frame' )
export const frameset = htmlElement( 'frameset' )
export const h1 = htmlElement( 'h1' )
export const h2 = htmlElement( 'h2' )
export const h3 = htmlElement( 'h3' )
export const h4 = htmlElement( 'h4' )
export const h5 = htmlElement( 'h5' )
export const h6 = htmlElement( 'h6' )
export const header = htmlElement( 'header' )
export const hr = htmlElement( 'hr' )
export const i = htmlElement( 'i' )
export const iframe = htmlElement( 'iframe' )
export const img = htmlElement( 'img' )
export const input = htmlElement( 'input' )
export const ins = htmlElement( 'ins' )
export const kbd = htmlElement( 'kbd' )
export const label = htmlElement( 'label' )
export const legend = htmlElement( 'legend' )
export const li = htmlElement( 'li' )
export const link = htmlElement( 'link' )
export const main = htmlElement( 'main' )
export const map = htmlElement( 'map' )
export const mark = htmlElement( 'mark' )
export const meta = htmlElement( 'meta' )
export const meter = htmlElement( 'meter' )
export const nav = htmlElement( 'nav' )
export const noframes = htmlElement( 'noframes' )
export const noscript = htmlElement( 'noscript' )
export const object = htmlElement( 'object' )
export const ol = htmlElement( 'ol' )
export const optgroup = htmlElement( 'optgroup' )
export const option = htmlElement( 'option' )
export const output = htmlElement( 'output' )
export const p = htmlElement( 'p' )
export const param = htmlElement( 'param' )
export const picture = htmlElement( 'picture' )
export const pre = htmlElement( 'pre' )
export const progress = htmlElement( 'progress' )
export const q = htmlElement( 'q' )
export const rp = htmlElement( 'rp' )
export const rt = htmlElement( 'rt' )
export const ruby = htmlElement( 'ruby' )
export const s = htmlElement( 's' )
export const samp = htmlElement( 'samp' )
export const script = htmlElement( 'script' )
export const section = htmlElement( 'section' )
export const select = htmlElement( 'select' )
export const small = htmlElement( 'small' )
export const source = htmlElement( 'source' )
export const span = htmlElement( 'span' )
export const strike = htmlElement( 'strike' )
export const strong = htmlElement( 'strong' )
export const style = htmlElement( 'style' )
export const sub = htmlElement( 'sub' )
export const summary = htmlElement( 'summary' )
export const sup = htmlElement( 'sup' )
export const svg = htmlElement( 'svg' )
export const table = htmlElement( 'table' )
export const tbody = htmlElement( 'tbody' )
export const td = htmlElement( 'td' )
export const template = htmlElement( 'template' )
export const textarea = htmlElement( 'textarea' )
export const tfoot = htmlElement( 'tfoot' )
export const th = htmlElement( 'th' )
export const thead = htmlElement( 'thead' )
export const time = htmlElement( 'time' )
export const title = htmlElement( 'title' )
export const tr = htmlElement( 'tr' )
export const track = htmlElement( 'track' )
export const tt = htmlElement( 'tt' )
export const u = htmlElement( 'u' )
export const ul = htmlElement( 'ul' )
export const _var = htmlElement( 'var' )
export const video = htmlElement( 'video' )
export const wbr = htmlElement( 'wbr' )
export default { fntags, fnbind }