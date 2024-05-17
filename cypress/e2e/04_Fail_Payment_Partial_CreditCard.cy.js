import paymentPage from '../pageObject/PageObject';

describe('Fail Payment using partial Credit Card and Credit Points', () => {
    let order_id;
    let creditPoints;
    let initialCreditPoints;
    let trimmedToken;
    let total_due;

    before(() => {
        cy.readFile('cypress/fixtures/idToken.txt').then((idToken) => {
            trimmedToken = idToken.trim();
        });
    });

    it('should fail payment with Credit Card and partial credit points', () => {
        paymentPage.getCurrentUserData(trimmedToken).then(userData => {
            const user_id = userData.id;
            initialCreditPoints = userData.credit_points;
            cy.log(`Your current Balance for userid: ${user_id} is ${initialCreditPoints}`);

            const paymentMethodId = 2; // Credit Card
            const amount = Cypress._.random(2, 4); // Random value between 2 and 10
            creditPoints = Cypress._.random(1, (amount - 1) * 100); // Random value between 1 and (amount-1)*100

            // Create order using page object method
            paymentPage.createOrder(trimmedToken, paymentMethodId, amount, creditPoints).then(response => {
                const orderData = response.body.data;
                order_id = orderData.order_id;
                total_due = orderData.total_due;
                cy.log('API response for Order:', JSON.stringify(response.body));

                // Make payment using page object method
                cy.makePayment(trimmedToken, order_id, creditPoints, total_due, paymentMethodId).then((paymentData) => {
                    cy.printResponse(paymentData);
                    cy.log(`${orderData.credit_points_used} Credit points used from users credit balance`);

                    // Fetch user data again to check updated credit balance after payment
                    paymentPage.getCurrentUserData(trimmedToken).then(userDataAfterPaymentResponse => {
                        const creditPointsAfterPayment = userDataAfterPaymentResponse.credit_points;
                        cy.log('Your Credit Balance After Payment is:', creditPointsAfterPayment);
                        paymentPage.navigateToCreditCardPaymentURL_fail(paymentData);
                    }).then(null, (error) => {
                    });
                });
            });
        }).then(null, (error) => {
        });
    });

    it('Query the database and read payment status', () => {
        paymentPage.queryPaymentStatus(order_id);
    });

    it('Query the database for refund', () => {
        paymentPage.refundPayment(order_id, creditPoints, initialCreditPoints).then(() => {
        });
    });
});
