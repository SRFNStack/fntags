import { describe, it, expect } from 'vitest'
import { fnlink, goTo, listenFor, beforeRouteChange, pathState } from '@srfnstack/fntags/fnroute'

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('fnroute', () => {
  describe('fnlink', () => {
    it('should create an anchor tag with href', () => {
      const l = fnlink({ to: '/foo' }, 'click me')
      expect(l.getAttribute('href')).toMatch(/\/foo$/)
    })
  })

  describe('listenFor', () => {
    it('should trigger events and return a working stop function', async () => {
      let triggered = false
      const stop = listenFor(beforeRouteChange, () => {
        triggered = true
      })

      goTo('/somewhere')
      await flush()

      expect(triggered).toBe(true)
      stop()
    })

    it('should throw for invalid event names', () => {
      expect(() => listenFor('bogus', () => {})).toThrow('Invalid event')
    })
  })

  describe('pathState', () => {
    it('should have a currentPath', () => {
      expect(pathState().currentPath).toBeDefined()
    })
  })
})
