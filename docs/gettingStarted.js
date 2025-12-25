import { div, h3, p, code, a, b, button } from './lib/fnelements.mjs'
import { fnstate } from './lib/fntags.mjs'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

const appCounter = fnstate(0)

const ClickyCounter = () => {
  const counter = fnstate(0)
  return div(
    { class: 'clicky-counter', style: { color: 'Tomato', border: '1px solid #ddd', padding: '10px', margin: '10px 0', borderRadius: '5px' } },
    appCounter.bindAs(count => div('Shared Global Count: ', count)),
    div('Local Component Count: ', counter.bindAs()),
    button({
      onclick: () => {
        appCounter(appCounter() + 1)
        counter(counter() + 1)
      },
      style: { marginTop: '10px' }
    }, 'Click Me!')
  )
}

const downloadExample = () => {
  const anchor = a({
    href: 'data:text/plain;charset=utf-8;base64,' + btoa(fntagsExample(
      'https://cdn.jsdelivr.net/npm/@srfnstack/fntags@1.0.0/src/fntags.mjs',
      'https://cdn.jsdelivr.net/npm/@srfnstack/fntags@1.0.0/src/fnelements.mjs'
    )),
    download: 'fntags-example.html'
  })
  anchor.click()
}

const fntagsExample = (fntagsUrl, fnElementsUrl) => `
<!-- The only html required -->
<html lang="en"><body><script type="module">
// Import fnstate and tags
import { fnstate } from '${fntagsUrl}'
import { div, button, style, title, meta } from '${fnElementsUrl}'

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
    border: 1px solid #ccc;
    padding: 20px;
    margin: 20px;
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

export default div(
  contentSection(
    'Getting Started',
    p('Welcome to ', b('fntags'), '! This guide will help you build your first application.'),
    p('fntags is designed to be simple and lightweight. You don\'t need a build step, a bundler, or a complex toolchain to get started. Just an HTML file and a browser.')
  ),
  contentSection(
    'Installation',
    p('Since fntags is an ES6 module, you can import it directly from a CDN or install it via npm.'),
    h3('Option 1: CDN (Recommended for prototyping)'),
    p('You can use fntags directly in your browser without downloading anything:'),
    prismCode(
            `<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<body>
    <script type="module">
        import { h,
            div
        } from 'https://cdn.jsdelivr.net/npm/@srfnstack/fntags@1.0.0/src/fntags.mjs'
        
        document.body.append(
            div("Hello, World!")
        )
    </script>
</body>
</html>`,
            null
    ),
    h3('Option 2: NPM'),
    p('If you prefer using npm:'),
    prismCode('npm install @srfnstack/fntags'),
    p('Then import it in your code:'),
    prismCode("import { div } from '@srfnstack/fntags'")
  ),
  contentSection(
    'TypeScript Support',
    p('fntags includes TypeScript definitions out of the box. No need to install separate @types packages.'),
    p('Just create a ', code('.ts'), ' or ', code('.tsx'), ' file (if you configure JSX, though plain functions are preferred) and enjoy full IntelliSense.')
  ),
  contentSection(
    'Your First Component',
    p('Components in fntags are just functions that return HTML elements. Let\'s create a simple greeting component.'),
    prismCode(
            `import { div, b } from './lib/fnelements.mjs'\n\n// A simple component\nconst Greeting = (name) => {\n    return div( "Hello, ", b(name), "!")\n}\n\ndocument.body.append(\n    Greeting("Developer")
)`,
            (function () {
              const Greeting = (name) => div('Hello, ', b(name), '!')
              return Greeting('Developer')
            })()
    )
  ),
  contentSection(
    'Full Interactive Example',
    p('Here is a complete, interactive example showing state sharing between components. Click the buttons to see it in action.'),
    div({ style: 'display: flex; flex-direction: column; gap: 10px; border: 1px solid #ccc; padding: 20px; border-radius: 8px;' },
      ClickyCounter(),
      ClickyCounter()
    ),
    p('You can download this entire example as a single HTML file to play with locally:'),
    button({ onclick: downloadExample }, 'Download Example HTML')
  ),
  contentSection(
    'Next Steps',
    p('Now that you have the basics down, check out the core concepts:'),
    div({ style: 'display: flex; gap: 10px; flex-wrap: wrap;' },
      a({ href: '/components', style: 'text-decoration: underline;' }, 'Components'),
      a({ href: '/state', style: 'text-decoration: underline;' }, 'State Management'),
      a({ href: '/routing', style: 'text-decoration: underline;' }, 'Routing')
    )
  )
)
