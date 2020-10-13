import { fnstate } from './lib/fntags.js'
import { button, code, div, pre } from './lib/fnelements.js'

export default ( sourceCode, demo, maxWidth = '450px' ) => {
    const isDemo = fnstate( false )

    const src = pre( { class: 'language-js', style: `font-size: 14px; width: 100%; box-sizing: border-box; box-shadow: 0px 0px 3px 0px rgba(0,0,0,0.75);` },
                     code( sourceCode.trim() ) )
    const demoDiv = div( { style: 'border-radius: 3px; width: 100%; box-sizing: border-box; box-shadow: 0px 0px 3px 0px rgba(0,0,0,0.75);' }, demo || '' )

    let highlighted = false
    const obs = new IntersectionObserver(
        ( entries ) => {
            entries
                .filter( el => el.isIntersecting )
                .forEach( () => {
                    if( !highlighted ) {
                        Prism.highlightElement( src )

                        const style = window.getComputedStyle( src )
                        demoDiv.style.height = style.getPropertyValue( 'height' )
                        demoDiv.style.margin = style.getPropertyValue( 'margin' )
                        demoDiv.style.padding = style.getPropertyValue( 'padding' )
                        highlighted = true
                        isDemo( false )
                    }
                } )
        } )
    obs.observe( src )
    return div( { style: `margin: auto; display: flex; flex-direction: column; align-items: flex-end; padding-bottom: 15px;width: 100%; max-width: ${maxWidth};` },
                demo &&
                button( { onclick: () => isDemo( !isDemo() ), style: 'width: 65px; padding: 3px 0;' },
                        isDemo.bindAs(() => isDemo() ? 'Code' : 'Demo' )
                )
                || '',

                isDemo.bindAs(() => isDemo() ? demoDiv : src )
    )

}