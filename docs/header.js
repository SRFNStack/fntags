//30px header, 25px text fntags - (15px text, vertical center aligned) functions as tags. Write javascript instead of html
//50px header with just text to
import { button, div, fnlink, form, hr, span, ul, input, goTo } from './fntags.js'
import { asNavItem } from './routes.js'
let navInput = input( { placeholder: 'navigate to' } )
export default () =>
    div( { class: 'container text-center' },
         form( {
                   style: 'display: inline-block',
                   onsubmit: ( e ) => {
                       e.preventDefault()
                       goTo( navInput.value.startsWith( '/' ) ? navInput.value : '/' + navInput.value )
                   }
               },
               navInput,
               button( { type: 'submit' }, 'go' )
         ),
         div( { class: 'display-font flex-center' },
              fnlink( { class: 'nav-link', style: 'cursor: pointer', to: '/' },
                      span( { style: 'font-size: 24px' }, 'fntags - ' ),
                      span( { style: 'font-size: 18px; margin-left: 5px' }, 'functions as tags.' ) )
         ),
         ul( { class: 'nav fn-nav noselect flex-center' }, ...asNavItem() ),
         hr()
    )