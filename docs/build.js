import { h } from './fntags.js'
import { a, b, div, h1, h4, p, span, strong } from './fnelements.js'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'
import { secondaryColor } from './constants.js'

export default div(
    contentSection(
        'Getting Started',
        'fntags is an es6 module, to start creating elements, import h or tag functions from \'fntags\' and use them to construct templates.',
        'Call fnapp with an element or an id to append elements to it.',
        prismCode(
            `<script type="module">
    import {fnapp, h} from './fntags.js'
    import {h1} from './fnelements.js'
    fnapp(document.body,
        h('div',
            h1("Internets go here.")
        )
    ) 
</script>`
        )
    ),
    contentSection(
        'Creating Templates Using the h() function',
        p( 'fntags provides a ',
           a( { style: { color: secondaryColor, 'text-decoration': 'underline' }, href: 'https://github.com/hyperhype/hyperscript' }, 'hyperscript' ),
           ' style function called h that is used for creating HTMLElements. This replaces using html, meaning everything is written in js.' ),
        prismCode( 'h(\'div\', \'hello world\')' ),
        'h takes a tag and a rest parameter of child elements. Children can be a string or a dom node.' +
        'Other types will be coerced to a string. If a child is an array, each element of the array will be appended.',
        prismCode( 'h(\'div\', h(\'span\', {class: \'hello\'}, \'hello world\'))' ),
        'To parameterize your element, declare your element as a function with parameters.',
        prismCode(
            '(name) => div("Aloha ", span(\`\${name}!\`))\n',
            ( ( name ) => div( 'Aloha, ', span( `${name}!` ) ) )( 'Jerry' ) ),
        'This function can now be exported to be used as a shared and reusable component.',
        prismCode( 'export const yo = (name) => div("What up, ", \`\${name}!\`)' ),
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
        'Pretty tags instead of h()',
        'To create a more html like template, you can also import all of the default html tags from either the index or fnelements.js directly.',
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
