import paymentPage from '../pageObject/PageObject';

describe('Create Order API Test', () => {
    let trimmedToken;

    before(() => {
        cy.readFile('cypress/fixtures/idToken.txt').then((idToken) => {
            trimmedToken = idToken.trim();
        });
    });

    it('validates Create Order API with integer value', () => {
        const amount = Math.floor(Math.random() * 4) + 1; // Generates a number between 1 and 4

        // Call the Page Object method to create the order with the provided amount
        paymentPage.CreateOrderWithAmount(trimmedToken, amount).then(({ response, paymentMethodId, amount, quantity }) => {
            const orderData = response.body;
            cy.printResponse(response);

            // Perform your validations using the provided amount and other generated values
            cy.validateResponse(paymentMethodId, orderData, amount, quantity);

            // Call the custom command to compare query results and pass the order_id
            cy.compareQueryResults(orderData.data.order_id, orderData.data.order_items[0].order_item_id, quantity, amount);
        });
    });

    it('validates Create Order API with Decimal value', () => {
        const amount = (Math.random() * 3 + 2).toFixed(1); // Generates a decimal number between 2 and 5 with one decimal place
        paymentPage.CreateOrderWithAmount(trimmedToken, amount).then(({ response, paymentMethodId, amount, quantity }) => {
            const orderData = response.body;
            cy.printResponse(response);
            cy.validateResponse(paymentMethodId, orderData, amount, quantity);
            cy.compareQueryResults(orderData.data.order_id, orderData.data.order_items[0].order_item_id, quantity, amount);
        });
    });

    it('validates Create Order API with Extras', () => {
        paymentPage.CreateOrderWithExtras(trimmedToken).then(({ response, paymentMethodId, amount, quantity }) => {
            const orderData = response.body;
            cy.printResponse(response);
            cy.validateResponse(paymentMethodId, orderData, amount, quantity);
            cy.compareQueryResults(orderData.data.order_id, orderData.data.order_items[0].order_item_id, quantity, amount);
        });
    });
});
