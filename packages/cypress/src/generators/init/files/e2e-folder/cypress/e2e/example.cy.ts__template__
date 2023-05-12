describe('Cypress example tests @example-cypress', () => {
  beforeEach(() => cy.visit('/'));

  it('should take the user to the next steps part of the page when clicking whats next', () => {
    cy.contains('a', "What's next?").click();
    cy.url().then((url) => {
      expect(url).to.contain('#commands');
    });
  });

  it('App should be up and running', () => {
    cy.get('#hero').find('span').should('have.text', "You're up and running");
  });

  it('App should have 5 learning materials', () => {
    cy.get('#learning-materials').find('a').should('have.length', 5);
  });
});
