import * as fntags from '../../docs/lib/fntags.mjs'
import { getAttrs, renderNode } from '../../docs/lib/fntags.mjs'

describe( 'fntags', () => {

    describe( 'h', () => {
        it( 'should create a an element with the passed in tag', () => {
            const e = fntags.h( 'div' )
            expect( e.tagName ).to.eq( 'DIV' )
        } )
        it( 'should set the namespace if specified in the tag', () => {
            const e = fntags.h( 'ns=http://www.w3.org/2000/svg|svg' )
            expect( e.namespaceURI ).eq( 'http://www.w3.org/2000/svg' )
            expect( e.tagName ).eq( 'svg' )
        } )
        it( 'should use the first non-node, object arg as attributes', () => {
            const e = fntags.h( 'div', { id: 'jerry' } )
            expect( e.id ).eq( 'jerry' )
        } )
        it( 'should not use null as attributes', () => {
            const e = fntags.h( 'div', null )
            expect( e.id ).eq( '' )
        } )
        it( 'should not use undefined as attributes', () => {
            const e = fntags.h( 'div', undefined )
            expect( e.id ).eq( '' )
        } )
        it( 'should not use arrays as attributes', () => {
            const e = fntags.h( 'div', [{ id: 'jerry' }] )
            expect( e.id ).eq( '' )
        } )
        it( 'should not use promises as attributes', () => {
            const p = Promise.resolve()
            p.id = 'jerry'
            const e = fntags.h( 'div', p )
            expect( e.id ).eq( '' )
        } )
        it( 'should not use dom nodes as attributes', () => {
            const e = fntags.h( 'div', fntags.h( 'div', { id: 'jerry' } ) )
            expect( e.id ).eq( '' )
        } )

        it( 'should initialize bound attributes', () => {
            const fn = () => 'jerry'
            fn.isBoundAttribute = true
            let initEl
            fn.init = ( attrName, element ) => {
                expect( attrName ).eq( 'name' )
                expect( element.tagName ).eq( 'DIV' )
                initEl = element
            }
            const e = fntags.h( 'div', {
                name: fn
            } )
            expect( e.getAttribute( 'name' ) ).eq( 'jerry' )
            expect( e ).eq( initEl )
        } )

        it( 'should append all the children passed and expand arrays', () => {
            const el = fntags.h( 'div',
                fntags.h( 'div' ),
                [fntags.h( 'div' ), fntags.h( 'div' ), fntags.h( 'div' )],
                fntags.h( 'div' ),
                fntags.h( 'div' ),
                [fntags.h( 'div' ), fntags.h( 'div' ), fntags.h( 'div' )],
                fntags.h( 'div' ) )
            expect( el.children.length ).eq( 10 )
        } )
        it( 'should convert bad data to text and include any strings', () => {
            const el = fntags.h( 'div', '1', null, '2', undefined, '3', {}, '4' )
            expect( el.innerText ).eq( '1null2undefined3[object Object]4' )
        } )

        it( 'should set the attribute and element property for value', () => {
            const el = fntags.h( 'input', { value: 'taco' } )
            expect( el.value ).eq( 'taco' )
            expect( el.getAttribute( 'value' ) ).eq( 'taco' )
        } )
        it( 'should set disabled, checked, and selected as booleans on the element', () => {
            const el = fntags.h( 'input', { disabled: true, checked: true, selected: true } )
            expect( el.disabled ).eq( true )
            expect( el.checked ).eq( true )
            expect( el.selected ).eq( true )
        } )
        it( 'should set string and number types as attributes', () => {
            const el = fntags.h( 'input', { id: 1, name: 'taco' } )
            expect( el.getAttribute( 'id' ) ).eq( '1' )
            expect( el.getAttribute( 'name' ) ).eq( 'taco' )
        } )

        it( 'should set namespaced attributes as ns attributes', () => {
            const el = fntags.h( 'input', { 'ns=http://www.w3.org/1999/xlink|xlink:href': '/foo/bar' } )
            expect( el.getAttributeNS( 'http://www.w3.org/1999/xlink', 'href' ) ).eq( '/foo/bar' )
        } )

        it( 'should use a style string correctly', () => {
            const el = fntags.h( 'marquee', {
                style: 'color: blue; font-size:50px; border:2px;'
            }, 'weee' )
            expect( el.style.color ).eq( 'blue' )
            expect( el.style['font-size'] ).eq( '50px' )
            expect( el.style.border ).eq( '2px' )
        } )

        it( 'should use a style object correctly', () => {
            const el = fntags.h( 'marquee', {
                style: {
                    color: 'blue',
                    'font-size': '50px',
                    border: '2px'
                }
            }, 'weee' )
            expect( el.style.color ).eq( 'blue' )
            expect( el.style['font-size'] ).eq( '50px' )
            expect( el.style.border ).eq( '2px' )
        } )

        it( 'should initialize bound styles', () => {
            const fn = () => 'blue'
            fn.isBoundStyle = true
            let initEl
            fn.init = ( style, element ) => {
                expect( style ).eq( 'color' )
                expect( element.tagName ).eq( 'MARQUEE' )
                initEl = element
            }
            const el = fntags.h( 'marquee', {
                style: {
                    color: fn,
                    'font-size': '50px',
                    border: '2px'
                }
            }, 'weee' )
            expect( el.style.color ).eq( 'blue' )
            expect( el.style['font-size'] ).eq( '50px' )
            expect( el.style.border ).eq( '2px' )
        } )

        it( 'should add an event listener when the attr is a function and the attr name starts with on', () => {
            let clicked = false
            const fn = () => clicked = true
            const el = fntags.h( 'marquee', {
                onclick: fn
            }, 'weee' )
            el.click()
            expect( clicked ).eq( true )
        } )

        it( 'should set weird values as attributes', () => {
            const el = fntags.h( 'marquee', {
                style: { color: null },
                'data-blue': true,
                null: undefined,
                name: { nameio: 'jello' },
                'ns=http://www.w3.org/1999/xlink|xlink:href': null
            }, 'weee' )
            expect( el.style.color ).eq( '' )
            expect( el.getAttribute( 'data-blue' ) ).eq( 'true' )
            expect( el.getAttribute( 'null' ) ).eq( 'undefined' )
            expect( el.getAttribute( 'name' ) ).eq( '[object Object]' )
            expect( el.getAttributeNS( 'http://www.w3.org/1999/xlink', 'href' ) ).eq( 'null' )
        } )

    } )

    describe( 'renderNode', () => {
        it( 'assumes a node if it\'s a truthy object without a then function', () => {
            let o = { id: 1 }
            let n = fntags.renderNode( o )
            expect( n ).eq( o )
        } )
        it( 'converts strings and numbers into text nodes', () => {
            let a = fntags.renderNode( 'a' )
            let i = fntags.renderNode( 1 )
            expect( a ).instanceOf( Text )
            expect( a.wholeText ).eq( 'a' )
            expect( i ).instanceOf( Text )
            expect( i.wholeText ).eq( '1' )
        } )

        it( 'resolves promise results into a node', async () => {
            let el = renderNode( Promise.resolve( 'hi' ) )
            expect( el.tagName ).eq( 'DIV' )
            expect( el.style.display ).eq( 'none' )
            let done
            let p = new Promise( ( res ) => {
                done = res
            } )
            el.replaceWith = ( rendered ) => {
                expect( rendered ).instanceOf( Text )
                expect( rendered.wholeText ).eq( 'hi' )
                done()
            }
            await p
        } )

        it( 'calls functions and creates nodes from their values', () => {
            let el = renderNode( () => 'hi' )
            expect( el ).instanceOf( Text )
            expect( el.wholeText ).eq( 'hi' )
        } )

        it( 'turns other stuff into test nodes', () => {
            let el = renderNode( null )
            expect( el ).instanceOf( Text )
            expect( el.wholeText ).eq( 'null' )
        } )

    } )

    describe( 'getAttrs', () => {
        it( 'returns the first element of the passed array if it\'s an attributes object', () => {

        } )
        it( 'doesn\'t have time for your bs', () => {
            expect( getAttrs( null ) ).empty
            expect( getAttrs( undefined ) ).empty
            expect( getAttrs( {} ) ).empty
            expect( getAttrs( () => {
            } ) ).empty
            expect( getAttrs( 0 ) ).empty
            expect( getAttrs( NaN ) ).empty
            expect( getAttrs( Infinity ) ).empty
        } )
    } )

    describe( 'styled', () => {
        it( 'adds the style to the element', () => {
            let s = fntags.styled( { color: 'blue' }, 'div', [] )
            expect( s.style.color ).eq( 'blue' )
        } )
        it( 'adds the style to an element with an existing style', () => {
            let s = fntags.styled( { color: 'blue' }, 'div', [{ style: { 'font-size': '10px' } }] )
            expect( s.style.color ).eq( 'blue' )
            expect( s.style['font-size'] ).eq( '10px' )
        } )
        it( 'allows overwriting the style', () => {
            let s = fntags.styled( { color: 'blue' }, 'div', [{ style: { color: 'purple' } }] )
            expect( s.style.color ).eq( 'purple' )
        } )
    } )
} )
