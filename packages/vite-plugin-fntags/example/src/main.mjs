import { hmrRoot } from '@srfnstack/fntags'
import { App } from './app.mjs'

const { rerender } = hmrRoot(document.getElementById('app'), App)

if (import.meta.hot) {
  import.meta.hot.accept('./app.mjs', () => rerender())
}
