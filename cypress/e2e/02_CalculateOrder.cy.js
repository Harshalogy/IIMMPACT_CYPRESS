import paymentPage from '../pageObject/PageObject';

describe('Calculate Order API Test', () => {
  let trimmedToken;

  before(() => {
    cy.readFile('cypress/fixtures/idToken.txt').then((idToken) => {
      trimmedToken = idToken.trim();
    });
  });

  it('validates Calculate Order API with integer value', () => {
    const amount = Math.floor(Math.random() * 4) + 1; // Generates a number between 1 and 4
    // Call the Page Object method to calculate the order with the provided amount
    paymentPage.calculateOrderWithAmount(trimmedToken, amount).then(({ response, paymentMethodId, amount, quantity }) => {
      const orderData = response.body;
      cy.printResponse(response);
      // Perform your validation using the provided amount and other generated values
      cy.validateResponse(paymentMethodId, orderData, amount, quantity);
    });
  });

  it('validates Calculate Order API with Decimal value', () => {
    const amount = (Math.random() * 3 + 2).toFixed(1); // Generates a decimal number between 2 and 5 with one decimal place
      paymentPage.calculateOrderWithAmount(trimmedToken, amount).then(({ response, paymentMethodId, amount, quantity }) => {
      const orderData = response.body;
      cy.printResponse(response);
      cy.validateResponse(paymentMethodId, orderData, amount, quantity);
    });
  });

  it('validates Calculate Order API with Full Credit Points', () => {
     paymentPage.calculateOrderWithCreditPoints(trimmedToken).then(({ response, paymentMethodId, amount, quantity, creditPoints }) => {
      const orderData = response.body;
      cy.printResponse(response);
      cy.validateResponse(paymentMethodId, orderData, amount, quantity);
    });
  });

  it('validates Calculate Order API with Extras', () => {
    paymentPage.calculateOrderWithExtras(trimmedToken).then(({ response, paymentMethodId, amount, quantity }) => {
      const orderData = response.body;
      cy.printResponse(response);
      cy.validateResponse(paymentMethodId, orderData, amount, quantity);
    });
  });
});
