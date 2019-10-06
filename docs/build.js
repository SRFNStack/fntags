import { b, div, h1, p, renderElement, shiftAttrs, span, strong } from './fntags.js'
import contentSection from './contentSection.js'
import prismCode from './prismCode.js'

export default div(
    contentSection(
        'Getting Started',
        'Acquire fntags/src/index.js (fntags.js for short) from npm or github and include it with your content.',
        'Import fnapp and tags from fntags.js. All non-deprecated html tags are available to import.',
        'Create new dom elements by calling the tags.',
        'Call fnapp with the root element and the elements to append.',
        prismCode( `<script type="module">
    import {fnapp, div, p, h1}
    from './fntags.js'
    fnapp(document.body,
        div(
            h1("Welcome"),
            p("to fntags")
        )
    ) 
</script>
`,
                   div(
                       h1( 'Welcome' ),
                       p( 'to fntags' )
                   )
        )
    ),
    contentSection(
        'Creating Elements',
        'Every tag is a function that takes an optional attributes object and the children of the element. A child can be a string, a dom node, or a function that returns either of those.',
        'Passing a function is useful when element creation needs to be deferred, delegated, or to create context variables like state objects.',
        'Elements are composed of tag function calls.',
        prismCode(
            'div({style:\'font-size: 20px;\'},\n' +
            '    \'hello!\',\n' +
            '    span( { style: \'color: green\' },\n' +
            '    \' world!\')\n' +
            ')',
            div( { style: 'font-size: 20px;' }, 'hello!', span( { style: 'color: green' }, ' world!' ) )
        ),
        'To set attributes and event handlers, pass an object as the first parameter to a tag.',
        'String properties of the object become the attributes of the element.',
        'Functions get added as event listeners for the property name less the \'on\' prefix.',
        'Other types get assigned to the element as a non-enumerable property.',
        prismCode(
            'div({style: "color: limegreen"},\n' +
            '    "こんにちは ", div("world!")\n' +
            ')',
            div( { style: 'color: limegreen' }, 'こんにちは ', div( 'world!' ) )
        ),

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

        'fntags provides a utility for shifting an attributes object from a rest parameter or array called shiftAttrs.',
        'This modifies the passed array. You can avoid this by using getAttrs instead.',

        prismCode( '(...children) => {\n' +
                   '    const attrs = shiftAttrs(children)\n' +
                   '    return div(\`Watch \${attrs.name} \`, ...children)\n' +
                   '}',
                   ( ( ...children ) => {
                       const attrs = shiftAttrs( children )
                       return div( `Watch ${attrs.name} `, ...children )
                   } )( { name: 'Jerry' }, span( 'of' ), p( 'the' ), strong( 'day' ) )
        ),


        'Children can be altered in any way before being passed to a tag.',
        prismCode( '( ...children ) => {\n' +
                   '    const attrs = shiftAttrs( children )\n' +
                   '    return div( \n' +
                   '        `Watch ${attrs.name} `,\n' +
                   '        ...children\n' +
                   '        .map(el =>\n' +
                   '            div({style:\'color:purple\'}, \n' +
                   '                el\n' +
                   '            ) \n' +
                   '         ) \n' +
                   '    )\n' +
                   '}',
                   ( ( ...children ) => {
                           const attrs = shiftAttrs( children )
                           return div(
                               `Watch ${attrs.name}`,
                               ...children
                               .map(el =>
                                         div({style:'color:purple'},
                                             el
                                         )
                               )
                           )
                       }
                   )( { name: 'Jerry' }, ' of', p( 'the' ), () => strong( 'day' ) )
        )
    )
)
