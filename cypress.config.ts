import { defineConfig } from 'cypress'

export default defineConfig({
  fileServerFolder: './docs',
  e2e: {
    supportFile: false,
    specPattern: 'test/**/*.cy.{js,jsx,ts,tsx}',
  },
})
