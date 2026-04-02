import { getQueriesForElement, prettyDOM } from '@testing-library/dom'

export { screen, fireEvent, waitFor, within } from '@testing-library/dom'

const containers = new Set()

/**
 * Render an fntags element or component into the DOM for testing.
 *
 * @param {Node|Function} elementOrFn A DOM element (e.g. from h() or div()) or a component function that returns one.
 * @param {{ container?: HTMLElement, baseElement?: HTMLElement }} [options]
 * @returns {{ container: HTMLElement, baseElement: HTMLElement, unmount: () => void, debug: (el?: HTMLElement) => void, ...queries }}
 */
export function render (elementOrFn, options = {}) {
  const baseElement = options.baseElement || document.body
  const container = options.container || baseElement.appendChild(document.createElement('div'))

  const element = typeof elementOrFn === 'function' ? elementOrFn() : elementOrFn

  if (element != null) {
    container.appendChild(element)
  }

  containers.add(container)

  return {
    container,
    baseElement,
    unmount () {
      container.innerHTML = ''
      containers.delete(container)
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    },
    debug (el) {
      console.log(prettyDOM(el || container))
    },
    ...getQueriesForElement(container)
  }
}

/**
 * Remove all rendered containers from the DOM and drain pending microtasks.
 *
 * fntags schedules DOM replacements (e.g. bindAs re-renders) as microtasks.
 * Returning a promise ensures those settle before the next test starts,
 * preventing cross-test contamination of internal framework state.
 *
 * Automatically registered with afterEach when available.
 */
export async function cleanup () {
  for (const container of containers) {
    container.innerHTML = ''
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }
  containers.clear()
  // Drain microtasks so any pending bindAs replaceWith() calls complete
  // before the next test starts.
  await new Promise(resolve => setTimeout(resolve, 0))
}

// Auto-cleanup between tests if a test framework is present
if (typeof afterEach === 'function') {
  afterEach(() => cleanup())
}
