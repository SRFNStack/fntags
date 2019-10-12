import { h } from './fntags.js'
import { a, b, div, h1, h4, p, span, strong } from './fnelements.js'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'
import { secondaryColor } from './constants.js'

export default div(
    contentSection(
        'Getting Started',
        prismCode( 'npm install fntags' ),
        'Use h or tag functions to create new elements.',
        'Call fnapp with an element or an id to append elements to it.',
        prismCode(
            `<script type="module">
    import {fnapp, h} from './fntags.js'
    import {p, h1} from './fnelements.js'
    fnapp(document.body,
        h('div',
            h1("Welcome"),
            p("to fntags")
        )
    ) 
</script>
`,
            h( 'div',
               h1( 'Welcome' ),
               p( 'to fntags' )
            )
        )
    ),
    contentSection(
        'Creating Templates Using h',
        p( 'fntags provides a ',
           a( { style: { color: secondaryColor, 'text-decoration': 'underline' }, href: 'https://github.com/hyperhype/hyperscript' }, 'hyperscript' ),
           ' style function called h.' ),
        prismCode( 'h(\'div\', \'hello world\')' ),
        'h takes a tag and a rest parameter of child elements. Children can be a string, a dom node, or a function that returns either.' +
        ' Other types will be coerced to a string. If a child is an array, each element will be appended, or specifically, the children are flatmapped.',
        prismCode( 'h(\'div\', h(\'span\', {class: \'hello\'}, \'hello world\'))' ),
        'Passing a function is useful when element creation needs to be deferred, delegated, or to create context variables like state objects.',
        prismCode(
            `h(\'div\',
    ()=>{
        const msg = \'hello world\'
        return msg
    }
)`,
            h( 'div',
               () => {
                   const msg = 'hello world'
                   return msg
               }
            ) ),
        'To parameterize your element, declare your element as a function with parameters',

        prismCode(
            '(name) => div("Aloha ", span(\`\${name}!\`))\n',
            ( ( name ) => div( 'Aloha, ', span( `${name}!` ) ) )( 'Jerry' ) ),

        'A rest parameter is recommended for including children in the parameters.',

        prismCode( '(name, ...children) =>\n' +
                   '    div(\n' +
                   '        \`Watch \${name} \`,\n' +
                   '        ...children\n' +
                   ')',
                   ( ( name, ...children ) => div( `Watch ${name} `, ...children ) )( 'Jerry', span( 'of' ), b( ' the' ), strong( ' day' ) )
        ),
        h4( 'Hyperscript Differences' ),
        'fntags does not support setting the id or class via the tag, you must pass an attributes object with an id or class property.',
        'fntags uses setAttribute for string properties instead of setting the property on the element and does not set them on the element object.'
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
            div( { style: 'color: limegreen' }, 'こんにちは ', div( 'world!' ) )
        )
    ),
    contentSection(
        'Creating templates with fnelements.js',
        'For html style templates import html tag functions from fnelements.js',
        'All non deprecated html elements and marquee(support and opinion varies) are exported as functions from fnelements.js.',
        prismCode(
            'div({style:\'font-size: 20px;\'},\n' +
            '    \'hello!\',\n' +
            '    span( { style: \'color: green\' },\n' +
            '    \' world!\')\n' +
            ')',
            div( { style: 'font-size: 20px;' }, 'hello!', span( { style: 'color: green' }, ' world!' ) )
        )
    )
)
