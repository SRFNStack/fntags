import { describe, it, expect } from 'vitest'
import { h, fnstate } from '@srfnstack/fntags'
import { render, screen, fireEvent, waitFor, cleanup } from '../src/index.mjs'

describe('render', () => {
  it('renders a plain element', () => {
    const { container } = render(h('div', 'hello world'))
    expect(container.textContent).toBe('hello world')
  })

  it('renders nested elements', () => {
    const el = h('div', h('span', 'inner'), h('p', 'paragraph'))
    const { container } = render(el)
    expect(container.querySelector('span').textContent).toBe('inner')
    expect(container.querySelector('p').textContent).toBe('paragraph')
  })

  it('renders a component function', () => {
    const Greeting = () => h('h1', 'Hello!')
    const { container } = render(Greeting)
    expect(container.querySelector('h1').textContent).toBe('Hello!')
  })

  it('returns query functions', () => {
    render(h('button', 'Click me'))
    expect(screen.getByText('Click me')).toBeTruthy()
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('returns scoped queries', () => {
    const { getByText } = render(h('div', 'scoped text'))
    expect(getByText('scoped text')).toBeTruthy()
  })

  it('renders into a custom container', () => {
    const customContainer = document.createElement('section')
    document.body.appendChild(customContainer)
    const { container } = render(h('p', 'custom'), { container: customContainer })
    expect(container.tagName).toBe('SECTION')
    expect(container.querySelector('p').textContent).toBe('custom')
    customContainer.remove()
  })

  it('unmount removes content and container', () => {
    const { container, unmount } = render(h('div', 'bye'))
    expect(document.body.contains(container)).toBe(true)
    unmount()
    expect(document.body.contains(container)).toBe(false)
  })

  it('cleanup removes all containers', () => {
    render(h('div', 'first'))
    render(h('div', 'second'))
    expect(document.body.children.length).toBeGreaterThanOrEqual(2)
    cleanup()
    expect(document.body.children.length).toBe(0)
  })

  it('handles null element gracefully', () => {
    const { container } = render(null)
    expect(container.children.length).toBe(0)
  })
})

describe('element attributes', () => {
  it('renders with attributes', () => {
    render(h('input', { type: 'text', placeholder: 'Enter name' }))
    const input = screen.getByPlaceholderText('Enter name')
    expect(input.type).toBe('text')
  })

  it('renders with style object', () => {
    const { container } = render(h('div', { style: { color: 'red' } }, 'styled'))
    expect(container.firstChild.style.color).toBe('red')
  })
})

describe('event handling', () => {
  it('fires click events', () => {
    let clicked = false
    render(h('button', { onclick: () => { clicked = true } }, 'Click'))
    fireEvent.click(screen.getByText('Click'))
    expect(clicked).toBe(true)
  })

  it('fires input events', () => {
    let value = ''
    render(h('input', { oninput: (e) => { value = e.target.value }, placeholder: 'type' }))
    const input = screen.getByPlaceholderText('type')
    fireEvent.input(input, { target: { value: 'hello' } })
    expect(value).toBe('hello')
  })
})

describe('fnstate + bindAs', () => {
  it('renders initial state', () => {
    const count = fnstate(0)
    render(h('div', count.bindAs(v => h('span', `Count: ${v}`))))
    expect(screen.getByText('Count: 0')).toBeTruthy()
  })

  it('updates DOM after state change via waitFor', async () => {
    const count = fnstate(0)
    render(h('div', count.bindAs(v => h('span', `Count: ${v}`))))
    expect(screen.getByText('Count: 0')).toBeTruthy()

    count(1)

    await waitFor(() => {
      expect(screen.getByText('Count: 1')).toBeTruthy()
    })
  })

  it('handles multiple state changes', async () => {
    const name = fnstate('Alice')
    render(h('div', name.bindAs(v => h('span', `Hello ${v}`))))

    name('Bob')
    await waitFor(() => expect(screen.getByText('Hello Bob')).toBeTruthy())

    name('Charlie')
    await waitFor(() => expect(screen.getByText('Hello Charlie')).toBeTruthy())
  })

  it('works with interactive components', async () => {
    const Counter = () => {
      const count = fnstate(0)
      return h('div',
        count.bindAs(v => h('span', `Count: ${v}`)),
        h('button', { onclick: () => count(count() + 1) }, 'Increment')
      )
    }

    render(Counter)
    expect(screen.getByText('Count: 0')).toBeTruthy()

    fireEvent.click(screen.getByText('Increment'))
    await waitFor(() => expect(screen.getByText('Count: 1')).toBeTruthy())

    fireEvent.click(screen.getByText('Increment'))
    await waitFor(() => expect(screen.getByText('Count: 2')).toBeTruthy())
  })
})

describe('fnstate + bindAttr', () => {
  it('binds attribute to state', () => {
    const disabled = fnstate(true)
    render(h('button', { disabled: disabled.bindAttr() }, 'Submit'))
    expect(screen.getByText('Submit').disabled).toBe(true)

    disabled(false)
    expect(screen.getByText('Submit').disabled).toBe(false)
  })
})

describe('fnstate + bindStyle', () => {
  it('binds style to state', () => {
    const color = fnstate('red')
    const { container } = render(h('div', { style: { color: color.bindStyle() } }, 'colored'))
    expect(container.firstChild.style.color).toBe('red')

    color('blue')
    expect(container.firstChild.style.color).toBe('blue')
  })
})

describe('fnstate + bindChildren', () => {
  it('renders array items', () => {
    const items = fnstate(['apple', 'banana', 'cherry'], v => v)
    const { container } = render(
      items.bindChildren(
        h('ul'),
        (itemState) => h('li', itemState.bindAs())
      )
    )
    const lis = container.querySelectorAll('li')
    expect(lis.length).toBe(3)
    expect(lis[0].textContent).toBe('apple')
    expect(lis[1].textContent).toBe('banana')
    expect(lis[2].textContent).toBe('cherry')
  })

  it('updates when items are added', async () => {
    const items = fnstate(['a', 'b'], v => v)
    const { container } = render(
      items.bindChildren(
        h('ul'),
        (itemState) => h('li', itemState.bindAs())
      )
    )
    expect(container.querySelectorAll('li').length).toBe(2)

    items(['a', 'b', 'c'])
    await waitFor(() => expect(container.querySelectorAll('li').length).toBe(3))
  })

  it('updates when items are removed', async () => {
    const items = fnstate(['x', 'y', 'z'], v => v)
    const { container } = render(
      items.bindChildren(
        h('ul'),
        (itemState) => h('li', itemState.bindAs())
      )
    )
    expect(container.querySelectorAll('li').length).toBe(3)

    items(['x', 'z'])
    await waitFor(() => {
      const lis = container.querySelectorAll('li')
      expect(lis.length).toBe(2)
      expect(lis[0].textContent).toBe('x')
      expect(lis[1].textContent).toBe('z')
    })
  })
})

describe('nested bindAs', () => {
  it('handles nested state bindings', async () => {
    const outer = fnstate('A')
    const inner = fnstate('1')

    render(h('div',
      outer.bindAs(o => h('div',
        `outer: ${o} `,
        inner.bindAs(i => h('span', `inner: ${i}`))
      ))
    ))

    expect(screen.getByText('inner: 1')).toBeTruthy()

    inner('2')
    await waitFor(() => expect(screen.getByText('inner: 2')).toBeTruthy())

    outer('B')
    await waitFor(() => {
      expect(screen.getByText(/outer: B/)).toBeTruthy()
      expect(screen.getByText('inner: 2')).toBeTruthy()
    })
  })
})
