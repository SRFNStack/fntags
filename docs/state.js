import { fnstate } from './lib/fntags.mjs'
import { br, button, code, div, input, span, h3, p, ul, li, flexRow } from './lib/fnelements.mjs'
import { secondaryColor } from './constants.js'
import prismCode from './prismCode.js'
import contentSection from './contentSection.js'

export default div(
  contentSection(
    'State Management',
    p('fntags provides a granular, high-performance reactivity system via ', code('fnstate'), '.'),
    p('Unlike Virtual DOM libraries that re-render entire component trees, fntags only updates the specific DOM nodes, attributes, or styles that are bound to the state.')
  ),

  contentSection(
    'Creating and Using State',
    p('Create a state container by calling ', code('fnstate(initialValue)'), '. It returns a function that acts as a getter and setter.'),
    prismCode(
`import { fnstate } from './lib/fntags.mjs'

const count = fnstate(0)

// Get value
console.log(count()) // 0

// Set value
count(1)
console.log(count()) // 1

// Subscribe to changes
count.subscribe(
    (newVal, oldVal) =>
        console.log('Changed!', newVal)
)`,
(function () {
  const count = fnstate(0)
  const logs = fnstate([])
  count.subscribe(val => logs([...logs(), `Changed! ${val}`]))
  return div(
    button({ onclick: () => count(count() + 1) }, 'Increment'),
    div('Value: ', count.bindAs()),
    div('Logs:', logs.bindChildren(div(), l => div(l.bindAs())))
  )
})()
    )
  ),

  contentSection(
    'Binding to Elements',
    p('The most common way to use state is to bind it to the DOM using ', code('bindAs'), '.'),
    prismCode(
`const name = fnstate('World')

div(
    'Hello, ',
    // bindAs takes a function that
    // returns the element to render
    name.bindAs(
        val => span(val)
    )
)
`,
(function () {
  const name = fnstate('World')
  return div(
    input({ value: name.bindAttr(), oninput: e => name(e.target.value) }),
    br(),
    'Hello, ',
    name.bindAs(val => span(val))
  )
})()
    ),
    p('When `name` changes, only the `span` is replaced. The surrounding `div` is untouched.')
  ),

  contentSection(
    'Binding Attributes & Styles',
    p('You can bind state to specific attributes or styles to avoid re-rendering the entire element.'),
    h3('bindAttr'),
    prismCode(
`const color = fnstate('red')

div(
    flexRow(
        { style: 'gap: 5px; margin-bottom: 10px' },
        ['red', 'green', 'blue'].map(c =>
            button(
                {
                    onclick: () => color(c),
                    style: { color: c } 
                },
                c
            )
        )
    ),
    div(
        {
            style: color.bindAttr(
                c => color: \${c} )
        },
        'I change color!'
    )
)`,
(function () {
  const color = fnstate('red')
  return div(
    flexRow({ style: 'gap: 5px; margin-bottom: 10px' },
      ['red', 'green', 'blue'].map(c =>
        button({ onclick: () => color(c), style: { color: c } }, c)
      )
    ),
    div({
      style: color.bindAttr(c => `color: ${c}; font-weight: bold; font-size: 1.2em;`)
    }, 'I change color!')
  )
})()
    ),
    h3('bindStyle'),
    p('For even more granularity, bind a single style property.'),
    prismCode(
    `const boxWidth = fnstate('100px')
    
    div({
        style: {
            width: boxWidth.bindStyle(),
            height: '100px',
            backgroundColor: '${secondaryColor}'
        }
    })`,
    (function () {
      const boxWidth = fnstate('100px')
      const randomWidth = () => Math.floor(Math.random() * (300 - 50 + 1) + 50) + 'px'
      return div(
        button({
          onclick: () => boxWidth(randomWidth())
        }, 'Random Width'),
        div({
          style: {
            width: boxWidth.bindStyle(),
            height: '100px',
            backgroundColor: secondaryColor,
            marginTop: '10px',
            borderRadius: '4px',
            transition: 'width 0.3s'
          }
        })
      )
    })()
    )
  ),

  contentSection(
    'Binding Object Properties',
    p('If your state holds an object, you can bind directly to one of its properties using ', code('bindProp'), '.'),
    prismCode(
`const user = fnstate({
    name: 'Alice',
    age: 25
})

div(
    'Name: ',
    // Updates only when user() changes,
    // displaying user().name
    user.bindProp('name') 
)`,
(function () {
  const user = fnstate({ name: 'Alice', age: 25 })
  return div(
    input({ placeholder: 'Change Name', oninput: e => user.assign({ name: e.target.value }) }),
    div('Name: ', user.bindProp('name'))
  )
})()
    )
  ),

  contentSection(
    'Modifying Object State',
    p('When state contains an object, you must trigger an update for the system to notice changes.'),
    h3('assign'),
    p('Use ', code('assign'), ' to merge partial updates (like Object.assign).'),
    prismCode(
`const user = fnstate({
    name: 'Alice',
    age: 25
})

// Triggers update
user.assign({ age: 26 })`,
(function () {
  const user = fnstate({ name: 'Alice', age: 25 })
  return div(
    div('User: ', user.bindAs(u => `${u.name} is ${u.age}`)),
    button({ onclick: () => user.assign({ age: user().age + 1 }) }, 'Birthday!')
  )
})()
    ),
    h3('getPath & setPath'),
    p('For deeply nested objects, use `getPath` and `setPath`.'),
    prismCode(
`const config = fnstate({
    theme: { dark: false }
})

// Get deep value
const isDark = config.getPath('theme.dark')

// Set deep value and trigger update
config.setPath('theme.dark', true)`,
(function () {
  const config = fnstate({ theme: { dark: false } })
  return div(
    div({
      style: config.bindAttr(() => ({
        padding: '10px',
        backgroundColor: config.getPath('theme.dark') ? '#333' : '#eee',
        color: config.getPath('theme.dark') ? '#fff' : '#000'
      }))
    }, 'Themed Box'),
    button({
      onclick: () => config.setPath('theme.dark', !config.getPath('theme.dark'))
    }, 'Toggle Theme')
  )
})()
    )
  ),

  contentSection(
    'Binding Arrays (Lists)',
    p('Use ', code('bindChildren'), ' to efficiently render lists. You must provide a key mapping function to help fntags track items.'),
    prismCode(
`const todos = fnstate(
    [{id: 1, text: 'Buy milk'}],
    item => item.id // Key mapper
)

ul(
    todos.bindChildren(
        div(), // Parent element
        // Item renderer
        (itemState) => li(
            itemState.bindProp('text')
        )
    )
)`,
(function () {
  const todos = fnstate([{ id: 1, text: 'Buy milk' }], item => item.id)
  let nextId = 2
  const chores = ['Walk Dog', 'Feed Cat', 'Wash Car', 'Do Laundry', 'Write Code', 'Fix Bug']
  return div(
    button({ onclick: () => todos([...todos(), { id: nextId++, text: chores[Math.floor(Math.random() * chores.length)] }]) }, 'Add Random Chore'),
    ul(
      todos.bindChildren(
        div(),
        (itemState) => li(itemState.bindProp('text'))
      )
    )
  )
})()
    )
  ),

  contentSection(
    'Selection State',
    p('When rendering lists, you often need to track which item is "selected". `fnstate` has built-in support for this.'),
    p('Use ', code('select(key)'), ' on the parent list state to set the selection, and ', code('bindSelect'), ' or ', code('bindSelectAttr'), ' on the child items to react to it.'),
    prismCode(
`const list = fnstate([1, 2, 3], i => i)

ul(
    list.bindChildren(div(), (itemState) => 
        li({
            // Select this item on click
            onclick: () =>
                list.select(itemState()),
            
            // Change style based on selection
            style: itemState.bindSelectAttr(() => ({
                fontWeight:
                    list.selected() === itemState()
                    ? 'bold' : 'normal'
            }))
        },
        itemState.bindAs()
        )
    )
)`,
(function () {
  const list = fnstate([1, 2, 3], i => i)
  return ul(
    list.bindChildren(div(), (itemState) =>
      li({
        onclick: () => list.select(itemState()),
        style: itemState.bindSelectAttr(() => ({
          fontWeight: list.selected() === itemState() ? 'bold' : 'normal',
          cursor: 'pointer',
          color: list.selected() === itemState() ? 'blue' : 'inherit'
        }))
      },
      itemState.bindAs()
      )
    )
  )
})()
    )
  ),

  contentSection(
    'Resetting State',
    p('You can reset the state value to its initial state by calling the state function with the initial value.'),
    p('You can also remove all listeners by calling ', code('reset(true)'), '.'),
    prismCode(
`const count = fnstate(0)

// Reset value (keeps listeners)
count(0)

// Stop updates (removes listeners)
count.reset(true)`,
(function () {
  const count = fnstate(0)
  return div(
    div('Count: ', count.bindAs()),
    div({ style: 'display: flex; gap: 5px;' },
      button({ onclick: () => count(count() + 1) }, 'Inc'),
      button({ onclick: () => count(0) }, 'Reset Value'),
      button({ onclick: () => count.reset(true) }, 'Stop Updates')
    )
  )
})()
    )
  )
)
