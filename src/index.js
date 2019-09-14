( () => {
    const tags = [
        'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio', 'b', 'base', 'basefont', 'bdi', 'bdo', 'big', 'blockquote', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'data',
        'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i',
        'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'meta', 'meter', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress',
        'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time',
        'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr'
    ]

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
        throw `Element type ${el.constructor && el.constructor.name || typeof el}
         is not supported. All elements must be one of or an array of [String, Function, Element, HTMLElement]`
    }

    const isNode = ( el ) => el instanceof Node || el instanceof Element ||
                             el.constructor.toString().search( /object HTML.+Element/ ) > -1

    const renderElement = ( el ) => {
        if( el.constructor.name === 'String' )
            return document.createTextNode( el )
        else if( el.constructor.name === 'Function' ) {
            const element = el
            if( typeof element === 'string' )
                return document.createTextNode( element )
            else if( !isNode( element ) ) badElementType( el )
            return element
        } else if( isNode( el ) )
            return el
        else
            badElementType( el )
    }


    window.initState = ( state ) => {
        const observers = []
        const notify = ( method ) => ( ...args ) => {
            let result = Reflect[ method ]( ...args )
            observers.forEach( o => o( args[ 0 ] ) )
            return result
        }
        const p = new Proxy( state, {
            set: notify( 'set' ),
            deleteProperty: notify( 'deleteProperty' ),
            defineProperty: notify( 'defineProperty' )
        } )
        p.watchState = ( observer ) => observers.push( observer )
        return [ p, ( el, update ) => {
            if( typeof el !== 'function' && !isNode(el)) throw 'You can only bind functions and Elements to state changes.'
            if( isNode(el) && typeof update !== 'function') throw 'You must supply an update function when binding directly to an element'
            let element = typeof el === 'function' ? renderElement( el( state ) ) : el

            const updateElement = update ? update : ( current, newState ) => {
                const newElement = renderElement( el( newState ) )
                element.replaceWith( newElement )
                element = newElement
            }
            state.watchState( (state) => updateElement(element, state) )
            return element
        } ]
    }

    tags.forEach( ( key ) => {
        if( window[ key ] ) {
            console.log( `window already has property ${key}. Use _${key} to use this tag.` )
            window[ '_' + key ] = htmlElement( key )
        } else {
            window[ key ] = htmlElement( key )
        }
    } )
} )()