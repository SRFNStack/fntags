import { goTo } from './lib/fnroute.mjs'
import { fnstate } from './lib/fntags.mjs'
import { a, button, div, hr, p, strong, style } from './lib/fnelements.mjs'
import prismCode from './prismCode.js'
import contentSection from './contentSection.js'

export const appCounter = fnstate(0)

// Create a Component function
export const ClickyCounter = () => {
  // Create a local state
  const counter = fnstate(0)

  // Return an HtmlElement
  return div(
    // Pass an object as attributes
    {
      class: 'clicky-counter',
      // Pass style as an object
      style: {
        color: 'Tomato'
      }
    },

    // Bind the state as an element
    appCounter.bindAs(
      count =>
        div('shared: ', count)
    ),

    // Bind the value without mutation
    div('local: ', counter.bindAs()),

    button({
      // Create a click handler
      onclick (e) {
        // Update bound elements
        appCounter(appCounter() + 1)
        counter(counter() + 1)
      }
    },

    // Set the button text
    'Click Me!'
    )
  )
}

const downloadExample = () => {
  const anchor = a({
    href: 'data:text/plain;charset=utf-8;base64,' + btoa(fntagsExample),
    download: 'fntags-example.html'
  })
  anchor.click()
}

export default () => div({ class: 'flex-center', style: 'flex-direction: column; font-size: 16px;' },
  style(`
  .clicky-counter {
    width: 100%;
    text-align: center;
  }`),
  p({ style: 'font-size: large' }, strong('fntags'), ' is an es6 browser module for creating apps on the web'),
  p('fntags exports a tag function for every html element to build templates with.'),
  p('A build process is not required and code can be served directly to all major browsers.'),
  p('fnstate provides high performance data binding to ensure your app is responsive and fast. '),
  p('Data binding is granular: bind a single element, an element attribute, or a style property.'),
  p('Single Page App routing is provided either statically, or dynamically using path based routing.'),
  contentSection('Basics',
    p('Below is an example that demonstrates the basic functionality of fntags. Click the download button to save it as an html file and run it in your browser!'),
    p({ style: 'text-align: center' }, button({ onclick: downloadExample }, 'Download Example')),
    prismCode(fntagsExample,
      div(ClickyCounter(), ClickyCounter(), ClickyCounter()),
      '100%'
    )
  ),
  hr(),
  button({ style: 'width: 220px', onclick: (e) => goTo('/components') }, 'Start Building')
)

const fntagsExample = `
<!-- The only html required -->
<html lang="en"><body><script type="module">
// Import fnstate and tags
import { 
  fnstate,
  div, button, style, title, meta 
} 
from 'https://cdn.jsdelivr.net/npm/@srfnstack/fntags@0.2.0/index.js'

// Create a shareable state container
export const appCounter = fnstate(0)

// Create a Component function
export const ClickyCounter = () => {
  // Create a local state
  const counter = fnstate(0)
  // Return an HtmlElement
  return div(
    // Pass an object as attributes
    {
      class: 'clicky-counter',
      // Pass style as an object
      style: {
        color: 'Tomato'
      },
    },
    // Bind the state as an element
    appCounter.bindAs(
      count =>
        div('shared: ', count)
    ),
    // Bind the value without mutation
    div('local: ', counter.bindAs()),
    button({
        // Create a click handler
        onclick (e) {
          // Update bound elements
          appCounter(appCounter() + 1)
          counter(counter() + 1)
        }
      },
      // Set the button text
      'Click Me!'
    )
  )
}

// Build the document header
document.head.append(
  title('fntags example'),
  meta({charset: 'utf-8'}),
  meta({
    'http-equiv': 'X-UA-Compatible',
     content: 'IE=edge'
  }),
  meta({
    name: 'viewport',
    content: 'width=device-width, initial-scale=1'
  })
)

// Append directly to the body
document.body.append(
  // Add app wide styles
  style(\`
  .clicky-counter {
    width: 100%;
    text-align: center;
  }
  \`),
  
  // Create components
  div(
    ClickyCounter(), 
    ClickyCounter(), 
    ClickyCounter()
  )
)
</script></body></html>
`
