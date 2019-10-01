//30px header, 25px text fntags - (15px text, vertical center aligned) functions as tags. Write javascript instead of html
//50px header with just text to
import { div, fnlink, li, span, ul } from './fntags.js'

export default () =>
    div( { class: 'container text-center' },
         div( { class: 'display-font flex-center' },
              span( { style: 'font-size: 24px' }, 'fntags - ' ), span( { style: 'font-size: 18px; margin-left: 5px' }, 'functions as tags.' )
         ),
         ul( { class: 'nav fn-nav noselect flex-center' },
             li( { class: 'nav-item' },
                 fnlink( { class: 'nav-link', to: '/' }, 'Home' )
             ),
             li( { class: 'nav-item' },
                 fnlink( { class: 'nav-link', to: '/gettingStarted' }, 'Getting Started' )
             ),
             li( { class: 'nav-item' },
                 fnlink( { class: 'nav-link', to: '/creatingComponents' }, 'Creating Components' )
             ),
             li( { class: 'nav-item' },
                 fnlink( { class: 'nav-link', to: '/componentState' }, 'Component State' )
             ),
             li( { class: 'nav-item' },
                 fnlink( { class: 'nav-link', to: '/routing' }, 'Routing' )
             )
         )
    )