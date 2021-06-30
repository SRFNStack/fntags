import { goTo } from './lib/fnroute.mjs'
import { a, button, div, hr, p, span } from './lib/fnelements.mjs'

const even = ( text ) => p( { style: 'font-weight: 400; margin-left: -15px; text-align: left; padding: 5px' }, text )
const odd = ( text ) => p({style: 'margin-left: 15px; text-align: left; padding: 5px'}, text )

export default ()=>div( { class: 'flex-center', style: 'flex-direction: column; font-size: 16px;' },
                    div(
                        ...[
                            span(a({href: 'https://github.com/hyperhype/hyperscript'}, 'Hyperscript'), ' Style Markup'),
                            'Make Reusable Components',
                            'Share State via Export',
                            'Granular State Binding',
                            'Debuggable Templates',
                            'Static Config-Based Routing',
                            'Dynamic Path-Based Routing',
                            'Only a few KB min+gzip',
                            'No Build Process Necessary'
                        ].map( ( txt, i ) => i % 2 === 0 ? even( txt ) : odd( txt ) )
                    ),
                    hr(),
                    button( { style: 'width: 220px', onclick: ( e ) => goTo( '/build/#Getting%20Started' ) }, 'Get Started' )
)
