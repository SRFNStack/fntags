import { div, p, strong } from './fntags.js'

export default div(
    p(strong( 'A framework for building web pages and single page apps' )),
    p( 'fntags uses js instead of html or templating.' ),
    p( strong('There\'s no set up, and no build process.') ),
    p( 'Functions are used to compose templates and re-usable components.' ),
    p( strong('Bind state to any element at any scope.') ),
    p( 'Elements can be bound to more than one state' ),
    p( strong('Routing is a feature of the framework.') )
)