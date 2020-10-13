import { goTo } from './lib/fntags.js'
import { a, button, div, hr, p, span } from './lib/fnelements.js'

const even = ( text ) => p( { style: 'font-weight: 400; margin-left: -15px; text-align: left; padding: 5px' }, text )
const odd = ( text ) => p({style: 'margin-left: 15px; text-align: left; padding: 5px'}, text )

export default ()=>div( { class: 'flex-center', style: 'flex-direction: column; font-size: 16px;' },
                    div(
                        ...[
                            span(a({href: 'https://github.com/hyperhype/hyperscript'}, 'Hyperscript'), ' Style Templates'),
                            'Create reusable elements',
                            'Global State using exports',
                            'Bind any state to any element',
                            'Bind to more than one state',
                            'Routing for single page apps',
                            'Only a few KB min+gzip'
                        ].map( ( txt, i ) => i % 2 === 0 ? even( txt ) : odd( txt ) )
                    ),
                    hr(),
                    button( { style: 'width: 220px', onclick: ( e ) => goTo( '/build/#Getting%20Started' ) }, 'Get Started' )
)