const FnTags = (() => ()=> {
    let lastId = 0
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

    const badElementType = ( el ) => {
        throw `Element type ${el.constructor && el.constructor.name || typeof el} `+
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

    const fntags = {
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
                    const newElement = update ? update( element, state ) : renderElement( element(state) )
                    if( newElement && isNode( newElement ) && !isTagged( newElement )) {
                        tagElement( newElement )
                        delete observers[ getElId( el.current ) ]
                        el.current.replaceWith( newElement )
                        el.current = newElement
                        addObserver( el, element, update )
                    }
                }
            }

            Object.defineProperty( p, '_fn_state_info', {
                value: Object.freeze( {addObserver} ),
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
                         {current: typeof element === 'function' ? renderElement( element( state ) ) : element}
                ).current
        }
    }

    return Object.freeze( [
                              'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio', 'b', 'base', 'basefont', 'bdi', 'bdo', 'big', 'blockquote', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'currentUser',
                              'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i',
                              'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'meta', 'meter', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress',
                              'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time',
                              'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr'
                          ].reduce( ( ft, tag ) => {
        ft[ tag ] = htmlElement( tag )
        return ft
    }, fntags ) )
})()

export const fntags = FnTags()
export const fnbind = fntags.fnbind