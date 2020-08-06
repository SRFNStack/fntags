import { fnbind, fnstate } from './fntags.js'
import { button, div, input } from './fnelements.js'
import prismCode from './prismCode.js'
import contentSection from './contentSection.js'

const appState = fnstate( { userName: 'Jerry' } )

export default div(
    contentSection(
        'Binding State',
        'State uses an observer to react to changes and update elements. ' +
        'fnstate returns a function. To access the current value of the function, call it with no arguments.' +
        'To change the state, pass the new state to the function.',
        prismCode( 'const count = fnstate(0)' ),
        'Use fnbind to listen to state changes and update the element.',
        prismCode( 'fnbind(count, ()=>`Current count: ${count()}`)' ),
        'When the state is changed, the passed function is executed, and the current element is replaced with the returned element.',
        'A promise can be returned from the function passed to fnbind. The promise should resolve to either an element, a function that returns an element, or another promise.',
    ),
    contentSection('Patching State',
                   'The function returned by fnstate has a patch function property that can be used to apply a patch to the existing state using Object.assign.',
                   prismCode(
                       'const userData = fnstate({name: "bob"})\n' +
                             'userData.patch({name:"Jerry"})')
                   ),
    contentSection(
        'Accessing Bound Dom Elements',
        'If you would like to get access to the dom elements that are bound to a state, you can use the findElement function from fntags.js.',
        'findElement behaves the same as Array.find. It takes the state to find the element on and an optional filter function.',
        'The first element the filter returns true for is returned. By default, the first element encountered is returned.',
        prismCode( 'findElement(state,\n    (el)=>el.innerText.startsWith("Current")\n)' ),
        'This should mostly be used want to reposition elements, clone them, or perform other non-destructive operations.',
        'If you remove or replace the element the link to the state will be broken and future state updates will not be reflected.',
        'You can safely update the children of the element as long as the child is not also bound to a state.'
    ),
    contentSection(
        'Updating Instead of Replacing',
        'If you don\'t want to replace the element, to maintain focus or cache a reference, pass the element and a function to update it with.',
        prismCode( 'fnbind(name,\n' +
                   '   input(\n' +
                   '       {\n' +
                   '           value: name(), \n' +
                   '           oninput: \n' +
                   '               (e)=>name(e.target.value) \n' +
                   '       }\n' +
                   '    ),\n' +
                   '    ( el ) => el.value = name()\n' +
                   ')',
                   div(
                       ( () => {
                           const name = fnstate( 'Jerry' )
                           return div(
                               fnbind( name, () => div( name() ) ),
                               fnbind( name,
                                       input(
                                           {
                                               value: name(),
                                               oninput:
                                                   ( e ) => name(e.target.value)
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
        fnbind(
            state,
            ()=> \`Current count: \${count()}\`
        ),
        button(
            {onclick: 
                ()=> count(state.count() + 1)
            },
            "+1"
        )
    )
}
`, ( () => {
                const count = fnstate( 0 )
                return div(
                    fnbind(
                        count,
                        () => `Current count: ${count()}`
                    ),
                    button(
                        { onclick: () => count(count()+ 1) },
                        '+1'
                    )
                )
            } )() )
    ),
    contentSection(
        'Binding Multiple States',
        'Any element can be bound to any number of states by passing an array of state objects as the first parameter of fnbind.',
        prismCode( `
()=> {
    const a = fnstate(0)
    const b = fnstate(0)
    return div(
        fnbind([a, b], 
            ()=> \`a: \${a()} b: \${b()}\`
        ),
        button(
            {onclick: ()=> a(a() + 1)},
            "a+1"
        ),
        button(
            {onclick: ()=> b(b() + 1)},
            "b+1"
        )
    )
}
`, ( () => {
                       const a = fnstate( 0 )
                       const b = fnstate( 0 )
                       return div(
                           fnbind( [ a, b ], () => `a: ${a()} b: ${b()}` ),
                           button( { onclick: () => a( a() + 1) }, 'a+1' ),
                           button( { onclick: () => b( b() + 1)}, 'b+1' )
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
   fnbind( [ appState, greeting ],
           () => \`\${greeting()} \${appState().userName}!\`
   ),
   div(
        fnbind( greeting,
            input( {
                value: greeting(),
                oninput: ( e ) => {greeting() = e.target.value}
            } ),
            ( el ) => el.value = greeting()
        ),
        'This input has a 500ms debounce',
        fnbind(
           appState,
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
                               fnbind( [ appState, greeting ],
                                       () => `${greeting()} ${appState().userName}!`
                               ),
                               div(
                                   fnbind( greeting,
                                           input( {
                                                      value: greeting(),
                                                      oninput: ( e ) => {greeting(e.target.value)}
                                                  } ),
                                           ( el ) => el.value = greeting()
                                   ),
                                   'This input has a 500ms debounce',
                                   fnbind(
                                       appState,
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