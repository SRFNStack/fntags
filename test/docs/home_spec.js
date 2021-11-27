describe('home page', () => {
  it('loads', () => {
    cy.visit('/')
    cy.get('#Basics').should('be.visible')
  })
})
