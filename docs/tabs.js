import { fnbind, fnstate, getAttrs } from './fntags.js'
import { a, div, li, ul } from './fnelements.js'

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

export default ( ...tabs ) => {
    let attrs = getAttrs(tabs)

    tabs.forEach( t => {
        if( !t.title || typeof t.title !== 'string' ) throw 'each tab must have a title attribute'
    } )

    if(!attrs.class) attrs.class = "tab-set"
    else attrs.class = attrs.class + " tab-set"

    const activeTab = fnstate( { index: 0 } )

    return div( attrs,
                ul( { class: 'nav nav-tabs' },
                    ...tabs.map( ( t, i ) => tabButton( activeTab, i, t ) )
                ),
                fnbind( activeTab,
                        () => tabs[ activeTab.index ] )
    )
}