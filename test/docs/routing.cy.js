describe('routing page', () => {
  it('loads', () => {
    cy.visit('/')
    cy.get('#Routing-link').click()
    cy.url().should('match', /.*\/routing$/)
    cy.get('#Navigating').should('be.visible')
  })
})
