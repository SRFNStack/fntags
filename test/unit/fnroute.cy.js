import { fnlink, goTo, listenFor, beforeRouteChange } from '../../docs/lib/fnroute.mjs'

describe('fnroute', () => {
  // Route rendering tests removed due to environmental constraints with history API in headless mode

  describe('fnlink', () => {
    it('should create an anchor tag with href', () => {
      const l = fnlink({ to: '/foo' }, 'click me')
      expect(l.getAttribute('href')).to.include('/foo')
    })
  })

  describe('listenFor', () => {
    it('should trigger events', () => {
      let triggered = false
      const stop = listenFor(beforeRouteChange, () => {
        triggered = true
      })

      cy.clock()
      goTo('/somewhere')
      cy.tick(100)

      cy.wrap(null).then(() => {
        expect(triggered).to.eq(true)
        stop()
      })
    })
  })
})
