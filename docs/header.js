//30px header, 25px text fntags - (15px text, vertical center aligned) functions as tags. Write javascript instead of html
//50px header with just text to
import { div, fnlink, span, ul } from './fntags.js'
import { asNavItem } from './routes.js'

export default () =>
    div( { class: 'container text-center' },
         div( { class: 'display-font flex-center' },
              fnlink( { class: 'nav-link', style: 'cursor: pointer', to: '/' },
                      span( { style: 'font-size: 24px' }, 'fntags - ' ),
                      span( { style: 'font-size: 18px; margin-left: 5px' }, 'functions as tags.' ) )
         ),
         ul( { class: 'nav fn-nav noselect flex-center' }, ...asNavItem() )
    )