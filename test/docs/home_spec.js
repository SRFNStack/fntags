describe('home page', () => {
  it('loads', () => {
    cy.visit('/')
    cy.get('#Home').should('be.visible')
  })
})
