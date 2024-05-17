import paymentPage from '../pageObject/PageObject';
describe('Fail Payment using Full Fave', () => {
    let order_id;
    let creditPoints;
    let initialCreditPoints;
    let trimmedToken;
    let total_due;

    // Read the idToken from the file before running the tests
    before(() => {
        cy.readFile('cypress/fixtures/idToken.txt').then((idToken) => {
            // Trim any leading/trailing white spaces from the token
            trimmedToken = idToken.trim();
        });
    });

    it('should fail payment with Full Fave', () => {
        paymentPage.getCurrentUserData(trimmedToken).then(userData => {
            const user_id = userData.id;
            initialCreditPoints = userData.credit_points;
            cy.log(`Your current Balance for userid: ${user_id} is ${initialCreditPoints}`);

            const paymentMethodId = 1; // Fave
            const amount = Cypress._.random(2, 4); // Random value between 2 and 10
            creditPoints = 0; // 0 credit points

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
                        paymentPage.navigateToFavePaymentURL_fail(paymentData);
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
        paymentPage.queryNoRefund(order_id, creditPoints, initialCreditPoints).then(() => {
        });
    });

});
