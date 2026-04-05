import { describe, it, expect, beforeEach } from 'vitest'
import { renderToString } from '../src/index.mjs'

describe('renderToString with routing', () => {
  beforeEach(() => {
    globalThis.__fntags_registry = undefined
  })

  it('renders the correct route for a given URL', async () => {
    const { html } = await renderToString({
      url: '/about',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const { route, routeSwitch } = await import('@srfnstack/fntags/fnroute')
        return h('div',
          routeSwitch(
            route({ path: '/', absolute: true }, h('p', 'Home page')),
            route({ path: '/about' }, h('p', 'About page')),
            route({ path: '/contact' }, h('p', 'Contact page'))
          )
        )
      }
    })
    expect(html).toContain('About page')
    expect(html).not.toContain('Home page')
    expect(html).not.toContain('Contact page')
  })

  it('renders the home route', async () => {
    const { html } = await renderToString({
      url: '/',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const { route, routeSwitch } = await import('@srfnstack/fntags/fnroute')
        return h('div',
          routeSwitch(
            route({ path: '/', absolute: true }, h('p', 'Home page')),
            route({ path: '/about' }, h('p', 'About page'))
          )
        )
      }
    })
    expect(html).toContain('Home page')
    expect(html).not.toContain('About page')
  })

  it('renders route with path parameters', async () => {
    const { html } = await renderToString({
      url: '/user/42',
      async appFn () {
        const { h } = await import('@srfnstack/fntags')
        const { route, routeSwitch, pathParameters } = await import('@srfnstack/fntags/fnroute')
        return h('div',
          routeSwitch(
            route({ path: '/user/:id' },
              pathParameters.bindAs(params => h('p', `User ID: ${params.id || 'none'}`))
            )
          )
        )
      }
    })
    expect(html).toContain('User ID: 42')
  })
})
