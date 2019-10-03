//30px header, 25px text fntags - (15px text, vertical center aligned) functions as tags. Write javascript instead of html
//50px header with just text to
import { div, fnbind, fnlink, hr, nav, pathState, span, ul } from './fntags.js'
import { primaryColor, secondaryColor } from './constants.js'
import { asNavItem } from './routes.js'

export default () =>
    div( { class: 'container text-center' },
         div( { class: 'flex-center' },
              fnlink( { class: 'nav-link', style: 'cursor: pointer', to: '/' },
                      fnbind( pathState, () =>
                          span( { class: 'display-font', style: 'font-size: 24px;' + ( pathState.info.currentRoute === '/' ? 'color: ' + secondaryColor : '' ) }, 'fntags - ' )
                      ),
                      span( { style: 'font-size: 18px; margin-left: 5px' }, 'functions as tags.' ) )
         ),
         nav( { class: 'navbar navbar-expand navbar-light', style: 'background-color: ' + primaryColor },
              ul( { class: 'nav fn-nav noselect flex-center' }, ...asNavItem() ) ),
         hr()
    )