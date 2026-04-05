/**
 * Client entry point — hydrates the server-rendered HTML.
 *
 * This file is served as a static ES module by spliffy. It imports the same
 * App component used on the server and calls hydrate() to attach event
 * listeners and reactive bindings to the existing DOM.
 */
import { hydrate } from '@srfnstack/fntags-ssr/hydrate'
import { App } from '../app/App.mjs'

hydrate(document.getElementById('app'), () => App())
