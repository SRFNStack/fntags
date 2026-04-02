import { describe, it, expect } from 'vitest'
import { div, span, button, ul, li, input, h1, flexRow } from '@srfnstack/fntags/fnelements'
import { fnstate } from '@srfnstack/fntags'
import { render, screen, fireEvent, waitFor } from '../src/index.mjs'

describe('fnelements in tests', () => {
  it('renders convenience element functions', () => {
    render(div(span('hello'), span('world')))
    expect(screen.getByText('hello')).toBeTruthy()
    expect(screen.getByText('world')).toBeTruthy()
  })

  it('renders with attributes via convenience functions', () => {
    render(button({ type: 'submit' }, 'Go'))
    const btn = screen.getByText('Go')
    expect(btn.tagName).toBe('BUTTON')
    expect(btn.type).toBe('submit')
  })

  it('renders lists with ul/li', () => {
    render(ul(li('one'), li('two'), li('three')))
    expect(screen.getByText('one').tagName).toBe('LI')
    expect(screen.getByText('two').tagName).toBe('LI')
  })

  it('renders flex layout helpers', () => {
    const { container } = render(flexRow(span('left'), span('right')))
    expect(container.firstChild.style.display).toBe('flex')
  })

  it('full component with fnelements', async () => {
    const TodoApp = () => {
      const todos = fnstate(['Buy milk', 'Walk dog'], v => v)
      const newTodo = fnstate('')

      return div(
        h1('Todos'),
        todos.bindChildren(
          ul(),
          (todo) => li(todo.bindAs())
        ),
        input({
          placeholder: 'New todo',
          oninput: (e) => newTodo(e.target.value)
        }),
        button({
          onclick: () => {
            if (newTodo()) {
              todos([...todos(), newTodo()])
              newTodo('')
            }
          }
        }, 'Add')
      )
    }

    render(TodoApp)
    expect(screen.getByText('Todos')).toBeTruthy()
    expect(screen.getByText('Buy milk')).toBeTruthy()
    expect(screen.getByText('Walk dog')).toBeTruthy()

    const todoInput = screen.getByPlaceholderText('New todo')
    fireEvent.input(todoInput, { target: { value: 'Read book' } })
    fireEvent.click(screen.getByText('Add'))

    await waitFor(() => {
      expect(screen.getByText('Read book')).toBeTruthy()
    })
  })
})
