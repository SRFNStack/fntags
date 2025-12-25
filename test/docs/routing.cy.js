describe('routing page', () => {
  it('loads', () => {
    cy.visit('/')
    cy.get('#Routing-link').click()
    cy.url().should('match', /.*\/routing$/)
    cy.get('#Routing').should('be.visible')
  })
})
