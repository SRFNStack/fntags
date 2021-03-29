//30px header, 25px text fntags - (15px text, vertical center aligned) functions as tags. Write javascript instead of html
//50px header with just text to
import { fnlink, pathState } from './lib/fnroute.mjs'
import { div, header, nav, span } from './lib/fnelements.mjs'
import { primaryColor, secondaryColor } from './constants.js'
import { routeNavItems } from './routes.js'

export default header( { class: 'container text-center' },
         div( { class: 'flex-center', style: 'padding-bottom: 10px' },
              fnlink( { style: {cursor: 'pointer', color:'inherit', 'text-decoration': 'none'}, to: '/' },
                      pathState.bindAs(() =>
                          span( { class: 'display-font', style: 'font-size: 24px;' + ( pathState().currentRoute === '/' ? 'color: ' + secondaryColor : '' ) }, 'fntags -' )
                      ),
                      span( { style: 'font-size: 18px; margin-left: 5px' }, 'less fluff, more stuff' ) )
         ),
         nav( { class: 'flex-center', style: 'border-bottom: solid 1px darkgray; background-color: ' + primaryColor },
              div( { class: 'flex-center noselect' }, ...routeNavItems() ) )
    )
