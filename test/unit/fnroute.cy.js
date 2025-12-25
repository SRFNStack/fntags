import { fnlink, goTo, listenFor, beforeRouteChange } from '../../docs/lib/fnroute.mjs'

describe('fnroute', () => {
  describe('fnlink', () => {
    it('should create an anchor tag with href', () => {
      const l = fnlink({ to: '/foo' }, 'click me')
      expect(l.getAttribute('href')).to.match(/\/foo$/)
    })
  })

  describe('listenFor', () => {
    it('should trigger events', () => {
      let triggered = false
      const stop = listenFor(beforeRouteChange, () => {
        triggered = true
      })

      goTo('/somewhere')

      cy.wrap(null).should(() => {
        expect(triggered).to.eq(true)
        stop()
      })
    })
  })
})
