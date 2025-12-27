import { div, h4, p, span, strong, code, flexCol, flexRow, flexCenteredCol, h1, button } from './lib/fnelements.mjs'
import { h, fntemplate, fnstate } from './lib/fntags.mjs'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
  contentSection(
    'Components',
    p('In fntags, a component is simply a function that returns an HTML element. There are no class-based components, specific lifecycle hooks, or "magical" props.'),
    p('fntags exports a function for every standard HTML5 tag (e.g., ', code('div'), ', ', code('span'), ', ', code('h1'), ', etc.).')
  ),

  contentSection(
    'Basic Usage',
    p('Tag functions take an optional attributes object as the first argument, followed by any number of child elements.'),
    prismCode(
`// Simple text content
div('Hello World')`,
div('Hello World')
    ),
    prismCode(
`// With attributes
div(
    {
        class: 'greeting',
        style: 'color: blue'
    },
    'Hello World'
)`,
div({ class: 'greeting', style: 'color: blue' }, 'Hello World')
    ),
    prismCode(
`// Nesting elements
div(
    h1('Title'),
    p('This is a paragraph.')
)`,
div(
  h1('Title'),
  p('This is a paragraph.')
)
    ),
    p('Children can be strings, numbers, other DOM nodes, or even arrays of these.')
  ),

  contentSection(
    'Reusable Components',
    p('To create a reusable component, define a function that accepts parameters (like props) and returns an element.'),
    prismCode(
`const Greeting = (name) =>
    div(
        'Hello, ',
        strong(name),
        '!'
    )

// Usage
div(
    Greeting('Alice'),
    Greeting('Bob')
)`,
(function () {
  const Greeting = (name) => div('Hello, ', strong(name), '!')
  return div(
    Greeting('Alice'),
    div(), // spacer
    Greeting('Bob')
  )
})()
    ),
    p('It is common practice to accept a rest parameter ', code('...children'), ' to allow your component to wrap other content.'),
    prismCode(
`const Card = (title, ...children) => 
    div(
        {
            style: 'border: 1px solid #ccc;' +
                   'padding: 10px;' +
                   'margin: 5px;'
        },
        h4(title),
        div(...children)
    )

// Usage
Card(
    'User Profile',
    p('Name: Alice'),
    button('Edit')
)`,
(function () {
  const Card = (title, ...children) =>
    div({ style: 'border: 1px solid #ccc; padding: 10px; margin: 5px;' },
      h4(title),
      div(...children)
    )
  return Card('User Profile',
    p('Name: Alice'),
    button('Edit')
  )
})()
    )
  ),

  contentSection(
    'Attributes & Events',
    p('The first argument to any tag function is the attributes object. Properties map directly to HTML attributes.'),
    p('Event listeners are added by using the standard ', code('on[event]'), ' naming convention.'),
    prismCode(
`button(
    {
        class: 'btn-primary',
        onclick: (e) => alert('Clicked!'),
        style: {
            backgroundColor: 'blue',
            color: 'white',
            padding: '10px'
        }
    },
    'Click Me'
)`,
button({
  class: 'btn-primary',
  onclick: (e) => alert('Clicked!'),
  style: {
    backgroundColor: 'blue',
    color: 'white',
    padding: '10px'
  }
}, 'Click Me')
    ),
    p('Note: Style properties can be strings or objects. If an object is provided, camelCase properties are converted to kebab-case CSS properties.')
  ),

  contentSection(
    'Layout Helpers',
    p('fntags provides several convenience wrappers around flexbox to make layout easier.'),
    prismCode(
`import {
    flexCol,
    flexRow,
    flexCenteredCol
} from './lib/fnelements.mjs'

div(
    // display: flex; flex-direction: column
    flexCol(
        div('Item 1'),
        div('Item 2')
    ),

    // display: flex; flex-direction: row
    flexRow(
        div('Left'),
        div('Right')
    ),

    // Centered column
    flexCenteredCol(
        div('Centered Item')
    )
)`,
div(
  flexCol({ style: 'border:1px solid #eee; margin:5px; padding:5px' },
    div('Item 1'),
    div('Item 2')
  ),
  flexRow({ style: 'border:1px solid #eee; margin:5px; padding:5px; gap: 5px;' },
    div('Left'),
    div('Right')
  ),
  flexCenteredCol({ style: 'border:1px solid #eee; margin:5px; padding:5px' },
    div('Centered Item')
  )
)
    )
  ),

  contentSection('Async Rendering',
    p('fntags has built-in support for Promises. If you pass a Promise as a child, fntags will render a placeholder and replace it with the resolved value when it becomes available.'),
    prismCode(
`const AsyncJoke = () => 
    div(
        'Here is a joke: ',
        fetch(
            'https://icanhazdadjoke.com/',
            { headers: { accept: 'text/plain' } }
        )
        .then(res => res.text())
        .then(joke =>
            span({ style: 'font-style: italic' }, joke)
        )
    )
`,
(function () {
  const AsyncJoke = () =>
    div(
      'Here is a joke: ',
      fetch('https://icanhazdadjoke.com/', { headers: { accept: 'text/plain' } })
        .then(res => res.text())
        .then(joke => span({ style: 'font-style: italic' }, joke))
    )
  return AsyncJoke()
})()
    )
  ),

  contentSection(
    'fntemplate for Efficient State Binding',
    p('The ', code('fntemplate'), ' function provides an efficient way to create reusable component templates that can be re-rendered with different contexts without re-creating the entire DOM structure. This is particularly powerful when combined with ', code('fnstate'), ' for reactive updates.'),
    p('When you pass an ', code('fnstate'), ' object to a ', code('fntemplate'), ' context, and then bind to it using ', code('ctx(key)'), ', fntags automatically sets up a subscription. This means any changes to the ', code('fnstate'), ' object will automatically update the corresponding parts of the rendered template, minimizing direct DOM manipulation and improving performance.'),
    prismCode(
`const count = fnstate(0);

const CounterTemplate = fntemplate((ctx) =>
  div(
    p('Count: ', ctx('currentCount')),
    button(
      { onclick: () => ctx('increment')() },
      'Increment'
    )
  )
);

// Usage: Pass the state and action to the context
const MyCounter = CounterTemplate({
  // Bind the current value of count
  currentCount: count.bindAs(),
  increment: () => count(count() + 1)
});

document.body.append(MyCounter);`,
(function () {
  const count = fnstate(0);

  const CounterTemplate = fntemplate((ctx) =>
    div(
      p('Count: ', ctx('currentCount')),
      button(
        { onclick: ctx('increment') },
        'Increment'
      )
    )
  );

  return CounterTemplate({
    currentCount: count.bindAs(),
    increment: () => count(count() + 1)
  })
})()
    )
  ),

  contentSection(
    'The h() function',
    p('Under the hood, all tag functions use the ', code('h()'), ' function. You can use it directly if you prefer hyperscript style or need to create elements with dynamic tag names.'),
    prismCode(
`import { h } from './lib/fntags.mjs'

h('div', { id: 'app' },
    h('h1', 'Hello'),
    h('p', 'World')
)`,
h('div', { id: 'app' },
  h('h1', 'Hello'),
  h('p', 'World')
)
    )
  )
)
