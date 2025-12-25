import { goTo } from './lib/fnroute.mjs'
import { button, div, hr, p, strong, style, h1, h2 } from './lib/fnelements.mjs'

export default () => div({ id: 'Home', class: 'flex-center', style: 'flex-direction: column; font-size: 16px;' },
  style(`
  .clicky-counter {
    width: 100%;
    text-align: center;
  }
  .why-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  @media (max-width: 600px) {
    .why-grid {
        grid-template-columns: 1fr;
    }
  }
  `),
  h1({ style: 'font-size: 3em; margin-bottom: 10px;' }, 'fntags'),
  p({ style: 'font-size: 1.2em; text-align: center; max-width: 600px;' },
    'A lightweight, no-build ES6 framework for building fast and reactive web applications.'
  ),

  div({ style: 'display: flex; gap: 20px; margin-top: 20px;' },
    button({
      style: 'width: 180px; font-size: 18px; padding: 12px; background-color: #4CAF50; color: white; border: none; border-radius: 4px;',
      onclick: (e) => goTo('/getting-started')
    }, 'Get Started'),
    button({
      style: 'width: 180px; font-size: 18px; padding: 12px;',
      onclick: (e) => window.open('https://github.com/SRFNStack/fntags', '_blank')
    }, 'GitHub')
  ),

  hr({ style: 'width: 100%; margin: 40px 0;' }),

  div({ style: 'margin-bottom: 40px; width: 100%;' },
    h2({ style: 'text-align: center; margin-bottom: 30px; border: none;' }, 'Why fntags?'),
    div({ class: 'why-grid' },
      div(strong('No Build Step'), p('Import directly from a CDN or your file system. No Webpack, no Babel, no headaches.')),
      div(strong('Granular State'), p('Bind only what needs to change—text, attributes, or styles—for high-performance updates.')),
      div(strong('Standards Based'), p('Just standard ES6 JavaScript and HTML5. Zero magic syntax to learn.')),
      div(strong('Effortless Debugging'), p('Tired of debugging framework internals? In fntags, there is no black box. Errors produce clean stack traces that point exactly to your source code.'))
    )
  )
)
