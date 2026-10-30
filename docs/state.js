import { fnstate, fntemplate } from './lib/fntags.mjs'
import { br, button, code, div, input, span, h3, p, strong, ul, li, flexRow, table, tbody, tr, td } from './lib/fnelements.mjs'
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
`import { fnstate, fntemplate } from './lib/fntags.mjs'

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
    p('When `name` changes, only the `span` is replaced. The surrounding `div` is untouched.'),
    p(strong('Important: '), 'For form inputs (', code('input'), ', ', code('textarea'), ', ', code('select'), '), always bind to the ', code('value'), ' attribute with ', code('bindAttr'), ': never wrap the input itself in ', code('bindAs'), '. ', code('bindAs'), ' replaces the element on every update, which destroys the currently-focused input and the user loses focus mid-keystroke. fntags emits a dev-mode console warning when this happens; call ', code('setDevMode(false)'), ' to silence it in production.'),
    prismCode(
`const name = fnstate('')

// GOOD: bindAttr updates the value in
// place; focus and cursor are preserved.
input({
    value: name.bindAttr(),
    oninput: e => name(e.target.value)
})

// BAD: bindAs replaces the input every
// keystroke; focus is lost on each edit.
name.bindAs(v => input({
    value: v,
    oninput: e => name(e.target.value)
}))`
    )
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
    p('fntags has two ways to render an array: ', code('bindChildren'), ' and ', code('bindRows'), '. Both need a key mapping function on the state so fntags can track items across updates, and both reuse, move and remove existing rows instead of rebuilding the list. The difference is who owns an item once it is on the page.'),
    p(code('bindChildren'), ' gives every item its own state. The item builder receives that state and builds a small component with it: the row can change its own item (', code('itemState.assign({ done: true })'), ') and only that row\'s bindings update, it can keep local state such as an edit mode, hold inputs, bind to other states, and render a different structure for different items.'),
    p(code('bindRows'), ' treats the array as the single source of truth and each row as a view of one item. Every row is stamped from the same ', code('fntemplate'), ' and filled from ', code('values(item, selected)'), '. A row never changes its own item: its handlers receive the item and update the array state, and the change flows back down to the rows whose item changed. Since rows have no state of their own, there is nothing per row to subscribe to or clean up.'),
    h3('Which one to use'),
    p('Use ', code('bindChildren'), ' when:'),
    ul(
      li('a row edits its own item in place, like a todo checkbox or an inline rename'),
      li('a row has local state that is not part of the data, like expanded, editing or a form draft'),
      li('a row contains inputs the user types into'),
      li('a row binds to other states (the current user, a theme, a filter) or is built from components'),
      li('rows have different structures for different kinds of items')
    ),
    p('Use ', code('bindRows'), ' when:'),
    ul(
      li('each row displays its item: tables, logs, search results, feeds, grids'),
      li('the data arrives or changes as a whole array (fetched pages, server pushes, sorting, filtering) and items are replaced rather than mutated'),
      li('the only interactions in a row are selecting it or actions that change the array, like remove, move or open'),
      li('the list is long or replaced often, so the memory and setup cost of a state per row adds up')
    ),
    p('A rule of thumb: if you would call a row a component, use ', code('bindChildren'), '. If you would call it a line of data, use ', code('bindRows'), '. They mix well, for example a ', code('bindRows'), ' table whose row click selects an item that a separate detail panel renders with ordinary bindings.')
  ),

  contentSection(
    'bindChildren',
    p('The item builder is called once per item with that item\'s state. Bind to it like any other state. Setting the item state (', code('itemState(newValue)'), ', ', code('assign'), ' or ', code('setPath'), ') updates that row\'s bindings and writes the new value back into the array, without re-rendering the rest of the list.'),
    prismCode(
`const todos = fnstate(
    [{id: 1, text: 'Buy milk', done: false}],
    item => item.id // Key mapper
)

ul(
    todos.bindChildren(
        div(), // Parent element
        // Item builder, called once per item
        (itemState) => li({
            // The row updates its own item
            onclick: () =>
                itemState.assign({ done: !itemState().done }),
            style: {
                cursor: 'pointer',
                textDecoration: itemState.bindStyle(
                    t => t.done ? 'line-through' : 'none'
                )
            }
        },
        itemState.bindProp('text')
        )
    )
)`,
(function () {
  const todos = fnstate([{ id: 1, text: 'Buy milk', done: false }], item => item.id)
  let nextId = 2
  const chores = ['Walk Dog', 'Feed Cat', 'Wash Car', 'Do Laundry', 'Write Code', 'Fix Bug']
  return div(
    button({ onclick: () => todos([...todos(), { id: nextId++, text: chores[Math.floor(Math.random() * chores.length)], done: false }]) }, 'Add Random Chore'),
    p('Click a chore to toggle it.'),
    ul(
      todos.bindChildren(
        div(),
        (itemState) => li({
          onclick: () => itemState.assign({ done: !itemState().done }),
          style: {
            cursor: 'pointer',
            textDecoration: itemState.bindStyle(t => t.done ? 'line-through' : 'none')
          }
        },
        itemState.bindProp('text')
        )
      )
    )
  )
})()
    )
  ),

  contentSection(
    'bindRows',
    p(code('bindRows(parent, template, { values, handlers })'), ' renders each item from an ', code('fntemplate'), '. The template must have a single root element.'),
    p(code('values(item, selected)'), ' maps an item, and the key currently selected with ', code('select(key)'), ', to the template\'s slots. It runs when a row is mounted, then again only when that item\'s reference changes or the row gains or loses selection, and only the slots whose value changed are written to the DOM. If ', code('values'), ' is omitted, the item itself is used as the slot values.'),
    p('Slots named in ', code('handlers'), ' are event slots. Every row shares one function per name, called as ', code('handler(event, item)'), ' with the row\'s current item, so handlers work on the item rather than on the row.'),
    p('Items are compared by reference, so update them immutably: put a new object in a new array. Mutating an item and setting the same array again leaves its row unchanged.'),
    prismCode(
`const people = fnstate([
    { id: 1, name: 'Ada', score: 3 },
    { id: 2, name: 'Grace', score: 5 }
], p => p.id)

const row = fntemplate(ctx =>
    tr({ class: ctx('cls'), onclick: ctx('select') },
        td(ctx('name')),
        td(ctx('score')),
        td(
            button({ onclick: ctx('bump') }, '+1'),
            button({ onclick: ctx('remove') }, 'x')
        )
    )
)

table(
    people.bindRows(tbody(), row, {
        values: (person, selected) => ({
            name: person.name,
            score: person.score,
            cls: selected === person.id ? 'selected' : ''
        }),
        handlers: {
            select: (e, person) => people.select(person.id),
            // Replace the item, don't mutate it
            bump: (e, person) => people(people().map(
                p => p === person ? { ...p, score: p.score + 1 } : p
            )),
            remove: (e, person) => {
                e.stopPropagation()
                people(people().filter(p => p !== person))
            }
        }
    })
)`,
(function () {
  const people = fnstate([
    { id: 1, name: 'Ada', score: 3 },
    { id: 2, name: 'Grace', score: 5 }
  ], p => p.id)
  const names = ['Alan', 'Barbara', 'Edsger', 'Frances', 'Ken', 'Margaret', 'Radia']
  let nextId = 3
  const row = fntemplate(ctx =>
    tr({ style: ctx('style'), onclick: ctx('select') },
      td({ style: 'padding: 2px 12px 2px 0; cursor: pointer;' }, ctx('name')),
      td({ style: 'padding: 2px 12px 2px 0;' }, ctx('score')),
      td(
        button({ onclick: ctx('bump') }, '+1'),
        button({ onclick: ctx('remove') }, 'x')
      )
    )
  )
  return div(
    button({ onclick: () => people([...people(), { id: nextId++, name: names[Math.floor(Math.random() * names.length)], score: 0 }]) }, 'Add Person'),
    button({ onclick: () => people([...people()].sort((a, b) => b.score - a.score)) }, 'Sort by Score'),
    table(
      people.bindRows(tbody(), row, {
        values: (person, selected) => ({
          name: person.name,
          score: person.score,
          style: selected === person.id ? `color: ${secondaryColor}; font-weight: bold;` : ''
        }),
        handlers: {
          select: (e, person) => people.select(person.id),
          bump: (e, person) => people(people().map(p => p === person ? { ...p, score: p.score + 1 } : p)),
          remove: (e, person) => {
            e.stopPropagation()
            people(people().filter(p => p !== person))
          }
        }
      })
    )
  )
})()
    ),
    p('As an escape hatch, ', code('values'), ' may return a bind getter (', code('bindAs'), ', ', code('bindAttr'), ', ', code('bindStyle'), ') or a node for a slot. Bindings created there are cleaned up when ', code('values'), ' runs again or the row is removed. Each one costs a subscription per row, which is what ', code('bindRows'), ' otherwise avoids, so if most rows need one, ', code('bindChildren'), ' is the better fit.')
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
  )
)
