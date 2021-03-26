import { h } from '../../docs/lib/fntags.mjs'

describe( 'fntags', () => {

    describe( 'h', () => {
        it( 'should create a an element with the passed in tag', () => {
            const d = h( 'div', 'hi' )
            expect( d.tagName ).to.eq( 'DIV' )
            expect( d.innerText ).to.eq( 'hi' )
        } )
    } )
} )
