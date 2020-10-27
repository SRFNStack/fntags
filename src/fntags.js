/**
 * Check if a value is an dom node
 * @param el
 * @returns {boolean}
 */
export const isNode = ( el ) => el instanceof Node

/**
 * Create a state object that can be bound to.
 * @param initialValue The initial state
 * @param mapKey A map function to extract a key from an element in the array. Receives the element and the index in the array.
 *                  The index should only be used for simple static cases where rows don't move around, a real unique key is much preferred.
 * @returns function A function that can be used to get and set the state
 */
export const fnstate = ( initialValue, mapKey ) => {
    let ctx = {
        currentValue: initialValue,
        observers: [],
        bindContexts: [],
        mapKey,
        state( newState ) {
            if( arguments.length === 0 ) {
                return ctx.currentValue
            } else {
                ctx.currentValue = newState
                for( let observer of ctx.observers ) {
                    observer( newState )
                }
            }
            return newState
        }
    }

    /**
     * Bind the values of this state to the given element.
     * Values are items/elements of an array.
     * If the current value is not an array, this will behave the same as bindAs.
     *
     * @param parent The parent to bind the children to.
     * @param element The element to bind to. If not a function, an update function must be passed
     * @param update If passed this will be executed directly when the state of any value changes with no other intervention
     */
    ctx.state.bindValues = ( parent, element, update ) => doBindValues( ctx, parent, element, update )

    /**
     * Bind this state to the given element
     *
     * @param element The element to bind to. If not a function, an update function must be passed
     * @param update If passed this will be executed directly when the state changes with no other intervention
     * @returns {(HTMLDivElement|Text)[]|HTMLDivElement|Text}
     */
    ctx.state.bindAs = ( element, update ) => doBindAs( ctx, element, update )

    /**
     * Mark the element with the given key as selected. This triggers select events to be dispatched.
     */
    ctx.state.select = ( key ) => doSelect( ctx, key )

    ctx.state.isFnState = true

    /**
     * Perform an Object.assign on the current state using the provided update
     */
    ctx.state.patch = ( update ) => ctx.state( Object.assign( ctx.currentValue, update ) )

    /**
     * Register a callback that will be executed whenever the state is changed
     */
    ctx.state.subscribe = ( callback ) => ctx.observers.push( callback )

    /**
     * Remove all of the observers and optionally reset the value to it's initial value
     */
    ctx.state.reset = ( reInit ) => doReset( ctx, reInit, initialValue )

    return ctx.state
}

function doReset( ctx, reInit, initialValue ) {
    ctx.observers = []
    if( reInit ) ctx.currentValue = initialValue
}

let deselectEvent = new Event( 'deselect' )
let selectEvent = new Event( 'select' )

function doSelect( ctx, key ) {
    for( let bindCtx of ctx.bindContexts ) {
        if( bindCtx.selected && bindCtx.boundElementByKey[ bindCtx.selected ] ) {
            bindCtx.boundElementByKey[ bindCtx.selected ].dispatchEvent( deselectEvent )
        }
        bindCtx.selected = key
        if( bindCtx.boundElementByKey[ key ] ) {
            bindCtx.boundElementByKey[ key ].dispatchEvent( selectEvent )
        }
    }
}

function doBindValues( ctx, parent, element, update ) {
    parent = renderNode( parent )
    if( !parent ) throw new Error( 'You must provide a parent element to bind the children to. aka Need Bukkit.' )
    if( typeof element !== 'function' && !update )
        throw new Error( 'You must pass an update function when passing a non function element' )
    if( !ctx.mapKey ) {
        console.warn( 'Using value index as key, may not work correctly when moving items...' )
        ctx.mapKey = ( o, i ) => i
    }

    if( !Array.isArray( ctx.currentValue ) ) {
        return ctx.state.bindAs( element, update )
    }
    ctx.currentValue = ctx.currentValue.map( fnstate )
    ctx.bindContexts.push( { element, update, parent } )
    ctx.state.subscribe( () => {
        if( !Array.isArray( ctx.currentValue ) ) {
            console.warn( 'A state used with bindValues was updated to a non array value. This will be converted to an array of 1 and the state will be updated.' )
            setTimeout( () => ctx.state( [ctx.currentValue] ), 1 )
        } else
            reconcile( ctx )
    } )
    reconcile( ctx )
    return parent
}

function doBindAs( ctx, element, update ) {
    if( typeof element !== 'function' && !update )
        throw new Error( 'You must pass an update function when passing a non function element' )
    if( update ) {
        let boundElement = renderNode( evaluateElement( element, ctx.currentValue ) )
        ctx.state.subscribe( () => update( boundElement ) )
        return boundElement
    } else {
        return replaceOnUpdate( ctx, () => element( ctx.currentValue ), 0 )
    }
}

/**
 * Replace the element when the state is updated
 */
function replaceOnUpdate( ctx, element, i ) {
    let current = setKey( ctx, renderNode( element() ), i )
    ctx.state.subscribe( function() {
        let newElement = setKey( ctx, renderNode( element() ), i )
        if( newElement ) {
            if( !newElement.key || newElement.key !== current.key ) {
                current.replaceWith( newElement )
                current = newElement
            }
        }
    } )
    return current
}

/**
 * Reconcile the state of the current array value with the state of the bound elements
 */
function reconcile( ctx ) {
    for( let bindContext of ctx.bindContexts ) {
        if( !bindContext.boundElementByKey ) bindContext.boundElementByKey = {}
        arrangeElements( ctx, bindContext )
    }
}

function setKey( ctx, element, i ) {
    if( !element.key && ctx.mapKey ) element.key = keyMapper( ctx.mapKey, ctx.currentValue, i )
    return element
}

function keyMapper( mapKey, value, index ) {
    if( typeof value !== 'object' )
        return value
    else if( !mapKey ) {
        return index
    } else
        return mapKey( value, index )
}

function arrangeElements( ctx, bindContext ) {
    if( ctx.currentValue.length === 0 ) {
        bindContext.parent.textContent = ''
        bindContext.boundElementByKey = {}
        return
    }
    let remainingElements = Object.keys( bindContext.boundElementByKey )
                                  .reduce( ( keys, key ) => ( keys[ key ] = true ) && keys, {} )
    let prev = null
    let parent = bindContext.parent
    let seenKeys = {}

    for( let i = ctx.currentValue.length - 1; i >= 0; i-- ) {
        let valueState = ctx.currentValue[ i ]
        if( !valueState || !valueState.isFnState )
            valueState = ctx.currentValue[ i ] = fnstate( valueState )
        let key = keyMapper( ctx.mapKey, valueState(), i )
        if( seenKeys[ key ] ) throw new Error( 'Duplicate keys in a bound array are not allowed.' )
        seenKeys[ key ] = true
        let current = bindContext.boundElementByKey[ key ]
        let isNew = false
        if( !current ) {
            isNew = true
            current = bindContext.boundElementByKey[ key ] = renderNode( evaluateElement( bindContext.element, valueState ) )
            current.key = key
        }
        //place the element in the parent
        if( !prev ) {
            if( !parent.lastChild || parent.lastChild.key !== current.key ) parent.append( current )
        } else {
            if( !prev.previousSibling ) {
                prev.insertAdjacentElement( 'beforeBegin', current )
            } else if( prev.previousSibling.key !== current.key ) {
                //if it's a new key, always insert it
                if( isNew )
                    prev.insertAdjacentElement( 'beforeBegin', current )
                //if it's an existing key, replace the current object with the correct object
                else
                    prev.previousSibling.replaceWith( current )
            }
        }
        prev = current

        delete remainingElements[ key ]
    }
    //deleted keys
    for( let key of Object.keys( remainingElements ) ) {
        if( ctx.selected === key ) ctx.selected = null
        bindContext.boundElementByKey[ key ].remove()
        delete bindContext.boundElementByKey[ key ]
    }
}

const evaluateElement = ( element, value ) => typeof element === 'function' ? element( value ) : element

/**
 * Convert non objects (objects are assumed to be nodes) to text nodes and allow promises to resolve to nodes
 */
export const renderNode = ( node ) => {
    if( typeof node === 'object' && node.then === undefined ) {
        return node
    } else if( node && typeof node.then === 'function' ) {
        const node = marker()
        node.then( el => node.replaceWith( renderNode( el ) ) ).catch( e => console.error( 'Caught failed node promise.', e ) )
        return node
    } else {
        return document.createTextNode( node + '' )
    }
}

/**
 * A function to create dom elements with the given attributes and children.
 * If an argument is a non-node object it is considered an attributes object, attributes are combined with Object.assign in the order received.
 * All standard html attributes can be passed, as well as any other property.
 * Strings are added as attributes via setAttribute, functions are added as event listeners, other types are set as properties.
 *
 * The rest of the arguments will be considered children of this element and appended to it in the same order as passed.
 *
 * @param tag html tag to use when created the element
 * @param children optional attrs and children for the element
 * @returns HTMLElement an html element
 *

 */
export const h = ( tag, ...children ) => {
    let element = document.createElement( tag )
    if( isAttrs( children[ 0 ] ) ) {
        let attrs = children.shift()
        for( let a in attrs ) {
            let attr = attrs[ a ]
            if( a === 'style' && typeof attr === 'object' ) {
                for( let style in attr ) {
                    let match = attr[ style ].toString().match( /(.*)\W+!important\W*$/ )
                    if( match )
                        element.style.setProperty( style, match[ 1 ], 'important' )
                    else
                        element.style.setProperty( style, attr[ style ] )
                }
            } else if( a === 'value' ) {
                //value is always an attribute because setting it as a property causes problems
                element.setAttribute( a, attr )
            } else if( typeof attr === 'string' ) {
                element.setAttribute( a, attr )
            } else if( a.startsWith( 'on' ) && typeof attr === 'function' ) {
                element.addEventListener( a.substring( 2 ), attr )
            } else {
                element[a] = attr
            }
        }
    }
    for( let child of children ) {
        if( Array.isArray( child ) )
            for( let c of child ) {
                element.append( renderNode( c ) )
            }
        else
            element.append( renderNode( child ) )
    }
    return element
}

export const isAttrs = ( val ) => val && typeof val === 'object' && !Array.isArray( val ) && !isNode( val )
/**
 * Aggregates all attribute objects from a list of children
 * @param children
 * @returns {{}} A single object containing all of the aggregated attribute objects
 */
export const getAttrs = ( children ) => isAttrs( children[ 0 ] ) ? children[ 0 ] : {}

/**
 * A hidden div node to mark your place in the dom
 * @returns {HTMLDivElement}
 */
const marker = ( attrs ) => h( 'div', Object.assign( attrs || {}, { style: 'display:none' } ) )