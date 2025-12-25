import { fnlink, goTo, listenFor, setRootPath, beforeRouteChange } from '../../docs/lib/fnroute.mjs'

describe('fnroute', () => {
  beforeEach(() => {
    // Reset path state before each test
    setRootPath('/')
    goTo('/', {}, true, true)
  })

  describe('fnlink', () => {
    it('should create an anchor tag with href', () => {
      const l = fnlink({ to: '/foo' }, 'click me')

      expect(l.getAttribute('href')).to.eq('/foo')
    })
  })

  describe('listenFor', () => {
    it('should trigger events', () => {
      let triggered = false

      const stop = listenFor(beforeRouteChange, () => {
        triggered = true
      })

      goTo('/somewhere')

      cy.wrap(null).then(() => {
        expect(triggered).to.eq(true)

        stop()
      })
    })
  })
})
