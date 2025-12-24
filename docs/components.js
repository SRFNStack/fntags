import { a, b, div, h4, p, span, strong } from './lib/fnelements.mjs'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
  contentSection(
    'Templating',
    p('fntags provides tags for every html tag, meaning everything is written in pure es6 and does not require compilation.'),
    prismCode('div(\'hello world\')'),
    'Each tag function takes an optional attributes object and a rest parameter of child elements. Children can be a string, a dom node, or a promise that returns either of those.',
    'Other types will be coerced to a string. If a child is an array, each element of the array will be appended.',
    prismCode('div(span({class: \'hello\'}, [\'hello \', \'world\']))'),
    'To parameterize your element, declare your element as a function with parameters.',
    prismCode(
      '(name) => div(\'Aloha \', span(name), \'!\')\n',
      ((name) => div('Aloha, ', span(name), '!'))('Jerry')),
    'This function can now be exported to be used as a shared and reusable component.',
    prismCode('export const yo = (name) => div(\'Yo, \', name, \'!\')'),
    'A rest parameter is recommended for including children in the parameters.',

    prismCode('(name, ...children) =>\n' +
      '    div(\n' +
      '        \'Watch \', name, ...children\n' +
      '    )',
    ((name, ...children) => div('Watch ', name, ...children))('Jerry', span(' of'), b(' the'), strong(' day'))
    )
  ),
  contentSection(
    'Attributes',
    'To set attributes and event handlers, pass an object as the first parameter to a tag.',
    'String properties of the object become the attributes of the element.',
    'Functions get added as event listeners for the property name less the \'on\' prefix.',
    'Other types get set as properties of the element.',
    prismCode(
      'div({style: "color: limegreen"},\n' +
      '    "こんにちは ", div("world!")\n' +
      ')',
      div({ style: 'color: limegreen' }, 'こんにちは ', div('world!'))
    )
  ),
  contentSection('Async Rendering',
    'A promise can be passed to h or any fnelement function and fntags will place the element on the page when the promise resolves.',
    'The promise should resolve to any valid input to h. Promises will continue to be resolved until a non promise is returned.',
    prismCode(`div(
   fetch(
       'https://icanhazdadjoke.com/',
       { headers: { accept: 'text/plain' } }
   )
       .then( res => res.text() )
       .then( div )
)`,
    div(
      fetch(
        'https://icanhazdadjoke.com/',
        { headers: { accept: 'text/plain' } }
      )
        .then(res => res.text())
        .then(joke => div(joke))
    )
    )
  ),
  contentSection(
    'The h() function',
    p('fntags provides an h function much like ', a({ href: '' }, 'Hyperscript'), '.'),
    'You can use this directly and avoid loading the fnelements file.',
    prismCode(
      'h( \'div\', {style:\'font-size: 20px;\'},\n' +
      '    \'hello!\',\n' +
      '    h( \'span\', { style: \'color: green\' },\n' +
      '    \' world!\')\n' +
      ')',
      div({ style: 'font-size: 20px;' }, 'hello!', span({ style: 'color: green' }, ' world!'))
    ),
    h4('Hyperscript Differences'),
    'fntags does not support setting the id or class via the tag, you must pass an attributes object with an id or class property.',
    'fntags uses setAttribute for string properties instead of setting the property on the element and does not set them on the element object.'
  )
)
