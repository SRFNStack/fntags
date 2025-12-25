describe('state page', () => {
  it('loads', () => {
    cy.visit('/')
    cy.get('#State-link').click()
    cy.url().should('match', /.*\/state$/)
    cy.get('[id="State Management"]').should('be.visible')
  })
})
