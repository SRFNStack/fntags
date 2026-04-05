/**
 * Shared application component — used on both server and client.
 */
import { h, registeredState } from '@srfnstack/fntags'
import { div, h1, h2, p, button, ul, li, nav, main, header, footer, input, span } from '@srfnstack/fntags/fnelements'
import { routeSwitch, route, fnlink, pathParameters } from '@srfnstack/fntags/fnroute'

const HomePage = () =>
  div(
    h2('Welcome'),
    p('This page was server-rendered with fntags SSR and hydrated on the client.'),
    p('Try clicking the counter button — it works because hydration restored event listeners and reactive bindings.')
  )

const Counter = () => {
  const count = registeredState('counter', 0)
  return div(
    h2('Interactive Counter'),
    p('This counter state is serialized on the server and restored on the client.'),
    div({ style: { display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' } },
      button({
        onclick: () => count(count() - 1),
        style: { padding: '8px 16px', fontSize: '18px', cursor: 'pointer' }
      }, '-'),
      count.bindAs(n =>
        span({ style: { fontSize: '24px', fontWeight: 'bold', minWidth: '48px', textAlign: 'center' } }, String(n))
      ),
      button({
        onclick: () => count(count() + 1),
        style: { padding: '8px 16px', fontSize: '18px', cursor: 'pointer' }
      }, '+')
    )
  )
}

const TodoList = () => {
  const todos = registeredState('todos', ['Learn fntags', 'Add SSR', 'Ship it'])
  const newTodo = registeredState('newTodo', '')

  const addTodo = () => {
    const text = newTodo().trim()
    if (text) {
      todos([...todos(), text])
      newTodo('')
    }
  }

  return div(
    h2('Todo List'),
    p('Add items and watch the list update. State is preserved across server and client.'),
    div({ style: { display: 'flex', gap: '8px', margin: '12px 0' } },
      newTodo.bindAs(val =>
        input({
          type: 'text',
          value: val,
          placeholder: 'What needs doing?',
          oninput: (e) => newTodo(e.target.value),
          onkeydown: (e) => { if (e.key === 'Enter') addTodo() },
          style: { padding: '8px', fontSize: '14px', flex: '1' }
        })
      ),
      button({
        onclick: addTodo,
        style: { padding: '8px 16px', cursor: 'pointer' }
      }, 'Add')
    ),
    todos.bindAs(items =>
      ul({ style: { listStyle: 'none', padding: '0' } },
        items.map((item, i) =>
          li({ style: { padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            span(item),
            button({
              onclick: () => todos(todos().filter((_, idx) => idx !== i)),
              style: { cursor: 'pointer', border: 'none', background: 'none', color: '#c00', fontSize: '16px' }
            }, 'x')
          )
        )
      )
    )
  )
}

const UserPage = () =>
  pathParameters.bindAs(params =>
    div(
      h2(`User Profile: ${params.id || '?'}`),
      p('This page demonstrates SSR with dynamic route parameters.'),
      p(`The path parameter "id" has value: ${params.id || 'unknown'}`)
    )
  )

const NavLink = (to, text) =>
  fnlink({ to, style: { marginRight: '16px', color: '#0066cc', textDecoration: 'none' } }, text)

export function App () {
  return div({ style: { fontFamily: 'system-ui, sans-serif', maxWidth: '640px', margin: '0 auto', padding: '20px' } },
    header({ style: { borderBottom: '2px solid #333', paddingBottom: '12px', marginBottom: '20px' } },
      h1({ style: { margin: '0 0 8px' } }, 'fntags SSR Example'),
      nav(
        NavLink('/', 'Home'),
        NavLink('/counter', 'Counter'),
        NavLink('/todos', 'Todos'),
        NavLink('/user/42', 'User 42')
      )
    ),
    main(
      routeSwitch(
        route({ path: '/', absolute: true }, HomePage()),
        route({ path: '/counter' }, Counter()),
        route({ path: '/todos' }, TodoList()),
        route({ path: '/user/:id' }, UserPage()),
        route({ path: '/' }, p('Page not found.'))
      )
    ),
    footer({ style: { marginTop: '40px', paddingTop: '12px', borderTop: '1px solid #ddd', color: '#666', fontSize: '14px' } },
      p('Served with @srfnstack/spliffy + @srfnstack/fntags-ssr')
    )
  )
}
