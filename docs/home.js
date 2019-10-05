import { button, div, goTo, hr, p } from './fntags.js'

const odd = ( text ) => p( text )
const even = ( text ) => p( { style: 'font-weight: 400' }, text )
export default div( { class: 'flex-center', style: 'flex-direction: column; font-size: 16px ' },
                    div(
                        ...[
                            'Javascript instead of html.',
                            'No set up and no build process.',
                            'Create re-usable elements.',
                            'Bind any state to any element.',
                            'Bind to more than one state.',
                            'Routing with nested routes.'
                        ].map( ( txt, i ) => i % 2 === 0 ? even( txt ) : odd( txt ) )
                    ),
                    hr(),
                    button( { style: 'width: 220px', onclick: ( e ) => goTo( '/build/#Getting%20Started' ) }, 'Get Started' )
)