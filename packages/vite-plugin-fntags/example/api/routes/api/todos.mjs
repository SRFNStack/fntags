let nextId = 1
const todos = [
  { id: nextId++, text: 'Try editing src/app.mjs', done: false },
  { id: nextId++, text: 'Watch state survive the reload', done: false }
]

export default {
  GET: () => ({
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(todos)
  }),

  POST: async ({ bodyPromise }) => {
    const { text } = await bodyPromise
    const todo = { id: nextId++, text, done: false }
    todos.push(todo)
    return {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(todo)
    }
  },

  DELETE: async ({ bodyPromise }) => {
    const { id } = await bodyPromise
    const idx = todos.findIndex(t => t.id === id)
    if (idx !== -1) todos.splice(idx, 1)
    return {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true })
    }
  }
}
