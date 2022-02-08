import { fnstate } from './lib/fntags.mjs'
import { br, button, code, div, input, span } from './lib/fnelements.mjs'
import prismCode from './prismCode.js'
import contentSection from './contentSection.js'

const appState = fnstate({ userName: 'Jerry' })
const data = fnstate([1, 2, 3, 4], v => v)
const peeps = fnstate(
  [
    { name: 'Greg', crashes: 0 },
    { name: 'Jerry', crashes: 9001 },
    { name: 'Jim', crashes: 0 },
    { name: 'Larry', crashes: 0 }
  ],
  peep => peep.name
)

export default div(
  contentSection(
    'Binding State',
    'Use the fnstate function to add reactivity to your app. ' +
    'The state functions created by fnstate are not tightly coupled to components and can be shared as needed.',
    'To create a state, call the fnstate function with the initial value, it returns a function.',
    prismCode('const count = fnstate( 0 )'),
    'To access the current value of the state, call it with no arguments.',
    prismCode('count() === 0'),
    'To change the state, pass a new value to the state.',
    prismCode('count( count() + 1 )'),
    span({ id: 'i-loaded' }, 'Call ',
      code('state.subscribe'),
      ' on the created state with a callback to be notified whenever there is a state change. This callback receives no arguments.'),
    prismCode(`count.subscribe( 
    () => alert( \`Current count: \${count()}\` )
)`),
    span('Call ',
      code('state.bindAs'),
      ' to bind the state with an element'),
    prismCode('count.bindAs( () => div(\'Current count: \', count()))'),
    'When the state is changed, the passed function is executed, and the current element is replaced with the newly returned element.'
  ),
  contentSection('Binding Attributes',
    span('If you only want to change the attributes of an element based on an fnstate, you can bind updates to individual attributes using the ',
      code('state.bindAttr'),
      ' function.'),
    prismCode(`const color = fnstate( 'pink' )

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
    (function () {
      const color = fnstate('pink')

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
            onkeyup: (e) => color(e.target.value)
          }
        ),
        div(
          { style: { 'font-size': '40px' } },
          'Ooo pretty color!'
        )
      )
    }())
    )
  ),
  contentSection('Binding Style',
    span('To bind only a single style property, use the ',
      code('state.bindStyle'),
      ' function.'),
    prismCode(`const color = fnstate( 'purple' )

return div(
     {
       style: {
         color: color.bindStyle() 
     }
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
       'Ooo even prettier colors!'
   )
)`,
    (function () {
      const color = fnstate('purple')

      return div(
        {
          style: {
            color: color.bindStyle()
          }
        },
        div('Type your favorite color'),
        input(
          {
            type: 'text',
            value: color(),
            onkeyup: (e) => color(e.target.value)
          }
        ),
        div(
          { style: { 'font-size': '40px' } },
          'Ooo even prettier colors!'
        )
      )
    }())
    )
  ),
  contentSection('Assigning State',
    'The function returned by fnstate has an assign function for applying updates to the state using Object.assign.',
    prismCode(
      'const userData = fnstate({name: "bob"})\n' +
      'userData.assign({name:"Jerry"})')
  ),
  contentSection('Two Way Binding',
    span('The easiest way to do two way binding on an input is via the ',
      code('state.bindAttr'),
      ' function.'),
    prismCode(`const name = fnstate( 'Jerry' )
return div(
   'Hello ', name.bindAs(),
   br(),
   input(
       {
           value: name.bindAttr(),
           oninput:
               ( e ) => name( e.target.value )
       }
   )
)`,
    (() => {
      const name = fnstate('Jerry')
      return div(
        'Hello ', name.bindAs(),
        br(),
        input(
          {
            value: name.bindAttr(),
            oninput:
                (e) => name(e.target.value)
          }
        )
      )
    })()
    )
  ),
  contentSection('Binding Lists',
    span('Call ',
      code('state.bindChildren'),
      ' to bind the state with the values of array. This will allow binding the position and value of the elements to reflect the current state of the array.'),
    'When using bindChildren, you must supply a mapKey function when creating the state, this is necessary to correctly match the array value to the corresponding element.',
    'For the following examples, peeps is ',
    prismCode(`const peeps = fnstate(
    [
        { name: 'Greg', crashes: 0 },
        { name: 'Jerry', crashes: 9001 },
        { name: 'Jim', crashes: 0 },
        { name: 'Larry', crashes: 0 }
    ],
    peep => peep.name
)`),
    prismCode(
      `peeps.bindChildren(
    div(),
    peep =>
        div(
            peep.bindAs(
                () =>
                    peep().name + ' crashed ' +
                    peep().crashes + ' times'
            )
        )
    )
)`,
      peeps.bindChildren(
        div(),
        peep =>
          div(
            peep.bindAs(
              () =>
                peep().name + ' crashed ' +
                peep().crashes + ' times'
            )
          )
      )
    ),
    'The bind function receives the value wrapped as an fnstate, not the raw value. This allows efficient binding to value changes on each row.',
    prismCode(`peeps.bindChildren(
   div( {
            style: {
                display: 'flex',
                flexDirection: 'column'
            }
        } ),
   peep =>
       div(
           div(
               peep.bindAs(
                   () =>
                       peep().name + ' crashed ' +
                       peep().crashes + ' times'
               )
           ),
           button(
               {
                   onclick: () =>
                       peep.assign(
                           {
                               crashes:
                                   peep().crashes + 1
                           }
                       )
               },
               \`Crash \${peep().name}\`
           )
       )
)`,
    peeps.bindChildren(
      div({
        style: {
          display: 'flex',
          flexDirection: 'column'
        }
      }),
      peep =>
        div(
          div(
            peep.bindAs(
              () =>
                peep().name + ' crashed ' +
                  peep().crashes + ' times'
            )
          ),
          button(
            {
              onclick: () =>
                peep.assign(
                  {
                    crashes:
                        peep().crashes + 1
                  }
                )
            },
              `Crash ${peep().name}`
          )
        )
    )
    ),
    'To reorder the elements, re-order the array',
    prismCode(`div(
   peeps.bindChildren(
       div(),
       peep =>
           div(
               peep.bindAs(
                   () =>
                       peep().name + ' crashed ' +
                       peep().crashes + ' times'
               )
           )
   ),
   button(
       {
           onclick: () => {
               let p = peeps()
               p.push( p.shift() )
               peeps( p )
           }
       },
       'Rotate'
   )
)`,
    div(
      peeps.bindChildren(
        div(),
        peep =>
          div(
            peep.bindAs(
              () =>
                peep().name + ' crashed ' +
                  peep().crashes + ' times'
            )
          )
      ),
      button(
        {
          onclick: () => {
            const p = peeps()
            p.push(p.shift())
            peeps(p)
          }
        },
        'Rotate'
      )
    )
    )
  ),
  contentSection('Selecting Children',
    'If using bindChildren, you can mark values in the array as selected and bind elements or attrs to the selected state.',
    span('The currently selected key can be accessed using',
      code('state.selected()'),
      '. The bound function receives the bound element as the only argument.'),
    prismCode(`let data = fnstate( [ 1, 2, 3, 4 ], v => v )
data.bindChildren(
   div(),
   value => span(
       {
           style: {
               padding: '10px',
               cursor: 'pointer',
               fontSize: '40px',
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
    data.bindChildren(
      div(),
      value => span(
        {
          style: {
            padding: '10px',
            cursor: 'pointer',
            fontSize: '40px'
          },
          onclick: () => data.select(value())
        },
        value.bindSelect(
          () =>
            data.selected() === value()
              ? `*${value()}*`
              : value()
        )
      )
    )),
    span('To bind attributes to selection changes, use the function ', code('state.bindSelectAttr'), '.'),
    prismCode(`let data = fnstate( [ 1, 2, 3, 4 ], v => v )
data.bindChildren(
   div(),
   value => span(
       {
           style: value.bindSelectAttr(
               () => ( {
                   color: data.selected() === value()
                    ? 'limegreen' : 'darkgrey',
                   padding: '10px',
                   cursor: 'pointer',
                   fontSize: '40px'
               } )
           ),
           onclick: () => data.select( value() )
       },
       value()
   )
)
`,
    data.bindChildren(
      div(),
      value => span(
        {
          style: value.bindSelectAttr(
            () => ({
              color: data.selected() === value()
                ? 'limegreen'
                : 'darkgrey',
              padding: '10px',
              cursor: 'pointer',
              fontSize: '40px'
            })
          ),
          onclick: () => data.select(value())
        },
        value()
      )
    ))
  ),
  contentSection(
    'Custom Handling',
    'If you want to perform extra shenanigans, you can get a handle on the element by passing an update function. This disables the normal handling of replacing the' +
    ' element when it changes.',
    prismCode(
      `name.bindAs(
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
        (() => {
          const name = fnstate('Jerry')
          return div(
            name.bindAs(() => div(name())),
            name.bindAs(
              input(
                {
                  value: name(),
                  oninput:
                    (e) => name(e.target.value)
                }
              ),
              (el) => { el.value = name() }
            )
          )
        })()
      )
    )
  ),

  contentSection(
    'Binding State at Any Scope',
    'As long as you have a handle on the state object you can bind to it. This means that states can be imported, used as global vars, or set on window.',
    prismCode(`
const appState = fnstate({userName: 'Jerry'}) 
const greeting = fnstate( 'Hello' )
let triggered = false
return div(
   greeting.bindAs(), ' ', appState.bindAs( () => appState().userName ), '!',
   div(
       input( {
                  value: greeting.bindAttr(),
                  oninput: ( e ) => greeting( e.target.value )
              } )
       ,
       br(),
       'This input has a 500ms debounce',
       br(),
       input( {
                  value: appState.bindAttr(()=> appState().userName || ''),
                  oninput: ( e ) => {
                      if( !triggered ) {
                          triggered = true
                          setTimeout( () => {
                              appState.assign( { userName: e.target.value } )
                              triggered = false
                          }, 500 )
                      }
                  }
              }
       )
   )
)
`, (() => {
      const greeting = fnstate('Hello')
      let triggered = false
      return div(
        greeting.bindAs(), ' ', appState.bindAs(() => appState().userName), '!',
        div(
          input({
            value: greeting.bindAttr(),
            oninput: (e) => greeting(e.target.value)
          })
          ,
          br(),
          'This input has a 500ms debounce',
          br(),
          input({
            value: appState.bindAttr(() => appState().userName || ''),
            oninput: (e) => {
              if (!triggered) {
                triggered = true
                setTimeout(() => {
                  appState.assign({ userName: e.target.value })
                  triggered = false
                }, 500)
              }
            }
          }
          )
        )
      )
    }
    )(),
    '100%'))
)
