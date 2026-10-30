describe('state page', () => {
  it('loads', () => {
    cy.visit('/')
    cy.get('#State-link').click()
    cy.url().should('match', /.*\/state$/)
    cy.get('[id="State Management"]').should('be.visible')
  })

  it('bindChildren demo toggles an item in place', () => {
    cy.visit('/')
    cy.get('#State-link').click()
    cy.get('[id="bindChildren"]').parent().contains('button', 'Demo').click()
    cy.contains('li', 'Buy milk').click()
    cy.contains('li', 'Buy milk').should('have.css', 'text-decoration-line', 'line-through')
    cy.contains('button', 'Add Random Chore').click()
    cy.contains('li', 'Buy milk').should('have.css', 'text-decoration-line', 'line-through')
  })

  it('bindRows demo updates, sorts and removes rows', () => {
    cy.visit('/')
    cy.get('#State-link').click()
    cy.get('[id="bindRows"]').parent().contains('button', 'Demo').click()
    cy.contains('tr', 'Ada').within(() => {
      cy.contains('button', '+1').click()
      cy.contains('button', '+1').click()
      cy.contains('button', '+1').click()
    })
    cy.contains('tr', 'Ada').find('td').eq(1).should('have.text', '6')
    cy.contains('button', 'Sort by Score').click()
    cy.contains('tr', 'Ada').parent().children().first().should('contain', 'Ada')
    cy.contains('tr', 'Grace').click()
    cy.contains('tr', 'Grace').should('have.css', 'font-weight', '700')
    cy.contains('tr', 'Ada').within(() => cy.contains('button', 'x').click())
    cy.contains('tr', 'Ada').should('not.exist')
    cy.contains('tr', 'Grace').should('have.css', 'font-weight', '700')
  })
})
