describe('components page', () => {
  it('loads', () => {
    cy.visit('/')
    cy.get('#Components-link').click()
    cy.url().should('match', /.*\/components$/)
    cy.get('#Templating').should('be.visible')
  })
})
