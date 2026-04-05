import { fnstate } from '@srfnstack/fntags'
import { div, button, input, ul, li, span, h2 } from '@srfnstack/fntags/fnelements'

const fetchTodos = async (todos, loading) => {
  loading(true)
  const res = await fetch('/api/todos')
  todos(await res.json())
  loading(false)
}

const addTodo = async (todos, inputText) => {
  const text = inputText().trim()
  if (!text) return
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text })
  })
  const todo = await res.json()
  todos([...todos(), todo])
  inputText('')
}

const removeTodo = async (todos, id) => {
  await fetch('/api/todos', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id })
  })
  todos(todos().filter(t => t.id !== id))
}

export const Todos = () => {
  const todos = fnstate([], t => t.id)
  const inputText = fnstate('')
  const loading = fnstate(false)

  fetchTodos(todos, loading)

  return div(
    h2('Todos (from spliffy API)'),
    div(
      { style: 'display: flex; margin-bottom: 12px;' },
      input({
        placeholder: 'Add a todo...',
        value: inputText.bindAttr(),
        oninput: (e) => inputText(e.target.value),
        onkeydown: (e) => { if (e.key === 'Enter') addTodo(todos, inputText) }
      }),
      button({ onclick: () => addTodo(todos, inputText) }, 'Add')
    ),
    loading.bindAs(l => l
      ? div('Loading...')
      : todos.bindChildren(
        ul({ class: 'todos' }),
        (todoState) => li(
          span(todoState.bindProp('text')),
          button({
            style: 'padding: 2px 8px; font-size: 12px;',
            onclick: () => removeTodo(todos, todoState().id)
          }, 'x')
        )
      )
    )
  )
}
