import { goTo } from './fntags.js'
import { a, button, div, hr, p, span } from './fnelements.js'

const even = ( text ) => p( { style: 'font-weight: 400; margin-left: -55px; padding: 5px' }, text )
const odd = ( text ) => p({style: 'margin-right: -50px; text-align: right; padding: 5px'}, text )

export default div( { class: 'flex-center', style: 'flex-direction: column; font-size: 16px;' },
                    div(
                        ...[
                            span(a({href: 'https://github.com/hyperhype/hyperscript'}, 'Hyperscript'), ' Style Templates'),
                            'No set up and no build process',
                            'Create re-usable elements',
                            'Bind any state to any element',
                            'Bind to more than one state',
                            'Routing for single page apps',
                            'Less than 2kb min+gz'
                        ].map( ( txt, i ) => i % 2 === 0 ? even( txt ) : odd( txt ) )
                    ),
                    hr(),
                    button( { style: 'width: 220px', onclick: ( e ) => goTo( '/build/#Getting%20Started' ) }, 'Get Started' )
)