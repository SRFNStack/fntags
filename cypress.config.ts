import { defineConfig } from 'cypress'

export default defineConfig({
  fileServerFolder: './docs',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    specPattern: 'test/**/*.cy.{js,jsx,ts,tsx}',
  },
})
