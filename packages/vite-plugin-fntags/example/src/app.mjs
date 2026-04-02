import { div, h1 } from '@srfnstack/fntags/fnelements'
import { Counter } from './counter.mjs'
import { Todos } from './todos.mjs'

export const App = () =>
  div(
    h1('fntags HMR Example'),
    Counter(),
    Todos()
  )
