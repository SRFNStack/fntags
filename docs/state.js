import { fnstate } from './lib/fntags.js'
import { br, button, code, div, input, span } from './lib/fnelements.js'
import prismCode from './prismCode.js'
import contentSection from './contentSection.js'

const appState = fnstate( { userName: 'Jerry' } )
let data = fnstate( [1, 2, 3, 4], v => v )

export default div(
    contentSection(
        'Binding State',
        'fntags uses an observer pattern to react to changes and update elements. ' +
        'To create a state, call the fnstate function with the initial value, it returns a function. ' +
        'To access the current value of the function, call it with no arguments. ' +
        'To change the state, pass the new value to the function.',
        prismCode( 'const count = fnstate(0)' ),
        span( 'Call ',
              code( 'state.subscribe' ),
              ' on the created state with a callback to be notified whenever there is a state change. This callback receives no arguments.' ),
        prismCode( `count.subscribe( 
    () => alert( \`Current count: \${count()}\` )
)` ),
        span( 'Call ',
              code( 'state.bindAs' ),
              ' to bind the state with an element' ),
        prismCode( 'count.bindAs( () => `Current count: ${count()}` )' ),
        'When the state is changed, the passed function is executed, and the current element is replaced with the newly returned element.',
        span( 'Call ',
              code( 'state.bindValues' ),
              ' to bind the state with the values of array. This will make the set of elements reflect changes to position and any change to value.' ),
        'When using bindValues, you must supply a mapKey function when creating the state, this is necessary to correctly match the array value to the corresponding element.',
        prismCode( 'const peeps = fnstate(["greg","jerry"], peep => peep)\n' +
                   'peeps.bindValues( (peep) => `Hello ${peep}` )' ),
        'The bind function receives the value wrapped as an fnstate, not the raw value. This allows binding to value changes.',
        'This is more efficient than re-setting the entire array as that will require re-creating each element in the array. ',
        'A promise can be returned from either bind function to allow for asynchronous element creation. The promise should resolve to either an element, a function that returns an element, or another promise.'
    ),
    contentSection( 'Binding Attributes',
                    span( 'If you only want to change the attributes of an element, you can bind state updates to single attributes using the ',
                          code( 'state.bindAttr' ),
                          ' function.' ),
                    prismCode( `const color = fnstate( 'pink' )

return div(
   {
       style: color.bindAttr(
           () => \`color: \${color()}\`
       )
   },
   input(
       {
           type: 'text',
           value: color(),
           onkeyup: ( e ) => color( e.target.value )
       }
   ),
   span(
       { style: { 'font-size': '40px' } },
       'Ooo pretty color!'
   )
)`,
                               function() {
                                   const color = fnstate( 'pink' )

                                   return div(
                                       {
                                           style: color.bindAttr(
                                               () => `color: ${color()}`
                                           )
                                       },
                                       div('Type your favorite color'),
                                       input(
                                           {
                                               type: 'text',
                                               value: color(),
                                               onkeyup: ( e ) => color( e.target.value )
                                           }
                                       ),
                                       div(
                                           { style: { 'font-size': '40px' } },
                                           'Ooo pretty color!'
                                       )
                                   )
                               }()
                    )
    ),
    contentSection( 'Selecting Children',
                    'If using bindValues, you can mark values in the array as selected and get notified via events that the element was selected or deselected.',
                    span( 'The currently selected key can be accessed using', code( 'state.selected()' ), '. The bound function receives the bound element as the only argument.' ),
                    prismCode( `let data = fnstate( [ 1, 2, 3, 4 ], v => v )
data.bindValues(
   div(),
   value => span(
       {
           style: {
               padding: '10px',
               cursor: 'pointer',
               'font-size': '40px',
           },
           onclick: () => data.select( value() )
       },
       value.bindSelect(
           () =>
               data.selected() === value()
                ? \`*\${value()}*\` : value()
       )
   )
)
`,
                               data.bindValues(
                                   div(),
                                   value => span(
                                       {
                                           style: {
                                               padding: '10px',
                                               cursor: 'pointer',
                                               'font-size': '40px',
                                           },
                                           onclick: () => data.select( value() )
                                       },
                                       value.bindSelect(
                                           () =>
                                               data.selected() === value()
                                               ? `*${value()}*` : value()
                                       )
                                   )
                               ) ),
                    span( 'If you only need to change attributes of the element, you can use the function ', code( 'state.bindAttrSelect' ), '.' ),
                    'It works the same as bindAttr, except it can be used to bind elements or text. ',
                    prismCode( `let data = fnstate( [ 1, 2, 3, 4 ], v => v )
data.bindValues(
   div(),
   value => span(
       {
           style: value.bindAttrSelect(
               () => ( {
                   color: data.selected() === value()
                    ? 'limegreen' : 'darkgrey',
                   padding: '10px',
                   cursor: 'pointer',
                   'font-size': '40px'
               } )
           ),
           onclick: () => data.select( value() )
       },
       value()
   )
)
`,
                               data.bindValues(
                                   div(),
                                   value => span(
                                       {
                                           style: value.bindAttrSelect(
                                               () => ( {
                                                   color: data.selected() === value()
                                                          ? 'limegreen' : 'darkgrey',
                                                   padding: '10px',
                                                   cursor: 'pointer',
                                                   'font-size': '40px'
                                               } )
                                           ),
                                           onclick: () => data.select( value() )
                                       },
                                       value()
                                   )
                               ) )
    ),
    contentSection( 'Patching State',
                    'The function returned by fnstate has a patch function property that can be used to apply a patch to the existing state using Object.assign.',
                    prismCode(
                        'const userData = fnstate({name: "bob"})\n' +
                        'userData.patch({name:"Jerry"})' )
    ),
    contentSection(
        'Updating Instead of Replacing',
        'To prevent replacing an element, to maintain focus or cache a reference, pass the element and a function to update it with. ' +
        'This function will be executed whenever the value changes, or if the value is an array, whenever an array element is removed, added, or replaced.',
        prismCode(
            ` name.bindAs(
   input(
       {
           value: name(),
           oninput:
               ( e ) => name( e.target.value )
       }
   ),
   ( el ) => el.value = name()
)`
            ,
            div(
                ( () => {
                    const name = fnstate( 'Jerry' )
                    return div(
                        name.bindAs( () => div( name() ) ),
                        name.bindAs(
                            input(
                                {
                                    value: name(),
                                    oninput:
                                        ( e ) => name( e.target.value )
                                }
                            ),
                            ( el ) => el.value = name()
                        )
                    )
                } )()
            )
        )
    ),
    contentSection(
        'Modifying State',
        'To modify the state, call the state function with the new state.',
        prismCode(
            `
const myElement = = ()=> {
    const count = fnstate(0)
    return div(
        count.bindAs(
            () => \`Current count: \${ count() }\`
        ),
        button(
            {onclick: 
                () => count( state.count() + 1 )
            },
            "+1"
        )
    )
}
`, ( () => {
                const count = fnstate( 0 )
                return div(
                    count.bindAs(
                        () => `Current count: ${count()}`
                    ),
                    button(
                        { onclick: () => count( count() + 1 ) },
                        '+1'
                    )
                )
            } )() )
    ),
    contentSection(
        'Granular Binding',
        'To be as efficient as possible you can bind single small values and update nothing else on the page',
        prismCode( `
()=> {
    const a = fnstate(0)
    const b = fnstate(0)
    return div(
        'a: ',a.bindAs( () => a() ),
        'b: ', b.bindAs( () => b() ),
        button(
            {onclick: () => a( a() + 1 )},
            "a+1"
        ),
        button(
            {onclick: () => b( b() + 1 )},
            "b+1"
        )
    )
}
`, ( () => {
                       const a = fnstate( 0 )
                       const b = fnstate( 0 )
                       return div(
                           `a: `, a.bindAs( () => a() ), 'b: ', b.bindAs( () => b() ),
                           button( { onclick: () => a( a() + 1 ) }, 'a+1' ),
                           button( { onclick: () => b( b() + 1 ) }, 'b+1' )
                       )
                   } )()
        )
    ),

    contentSection(
        'Binding State at Any Scope',
        'As long as you have a handle on the state object you can bind to it. This means that states can be imported, used as global vars, or set on window.',
        prismCode( `
const appState = fnstate({userName: 'Jerry'}) 
() => {
const greeting = fnstate( 'Hello' )
let triggered = false
return div(
   greeting.bindAs(() => greeting()), appState.bindAs( () => appState().userName),'!',
   div(
        greeting.bindAs(
           input( {
                      value: greeting(),
                      oninput: ( e ) => {greeting( e.target.value )}
                  } ),
           ( el ) => el.value = greeting()
        ),
        'This input has a 500ms debounce',
         appState.bindAs(
           input( {
                value: appState().userName || '',
                oninput: ( e ) => {
                  if( !triggered ) {
                      triggered = true
                      setTimeout( () => {
                          appState.patch({userName: e.target.value})
                          triggered = false
                      }, 500 )
                  }
                }
                }
           ),
           ( el => {el.value = appState().userName}
        )
   )
)
}
`, ( () => {
                           const greeting = fnstate( 'Hello' )
                           let triggered = false
                           return div(
                               greeting.bindAs( () => greeting() ), ' ', appState.bindAs( () => appState().userName ), '!',
                               div(
                                   greeting.bindAs(
                                       input( {
                                                  value: greeting(),
                                                  oninput: ( e ) => {greeting( e.target.value )}
                                              } ),
                                       ( el ) => el.value = greeting()
                                   ),
                                   br(),
                                   'This input has a 500ms debounce',
                                   br(),
                                   appState.bindAs(
                                       input( {
                                                  value: appState().userName || '',
                                                  oninput: ( e ) => {
                                                      if( !triggered ) {
                                                          triggered = true
                                                          setTimeout( () => {
                                                              appState.patch( { userName: e.target.value } )
                                                              triggered = false
                                                          }, 500 )
                                                      }
                                                  }
                                              }
                                       ),
                                       ( el ) => {el.value = appState().userName}
                                   )
                               )
                           )
                       }
                   )(),
                   '100%' ) )
)