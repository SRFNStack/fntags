import { a, div, fnbind, fnstate, li, ul } from './fntags.js'

const tabButton = ( activeTab, thisIndex, { title } ) =>
    li( { class: 'nav-item', style:"cursor: pointer" },
        fnbind( activeTab,
                () => a( {
                             class: `nav-link ${activeTab.index === thisIndex ? 'active' : ''}`,
                             onclick: ()=>activeTab.index = thisIndex
                         },
                         title
                ) )
    )
export default ( {containerAttrs, tabs} ) => {

    if(!containerAttrs) containerAttrs = {}
    if(typeof containerAttrs !== 'object') throw "container attributes must be an object"

    tabs.forEach( t => {
        if( typeof t !== 'object' ) throw 'each tab must be an object. Example {title: \'tab1\', content: div(\'hello\')'
        if( !t.title || typeof t.title !== 'string' ) throw 'you must provide a title'
    } )

    let attrs = Object.assign( {style: "padding: 20px"}, containerAttrs)
    if(!attrs.class) attrs.class = "tab-set"
    else attrs.class = attrs.class + " tab-set"

    const activeTab = fnstate( { index: 0 } )
    return div( attrs,
                ul( { class: 'nav nav-tabs' },
                    ...tabs.map( ( t, i ) => tabButton( activeTab, i, t ) ) ),
                fnbind( activeTab, () => tabs[ activeTab.index ].content )
    )
}