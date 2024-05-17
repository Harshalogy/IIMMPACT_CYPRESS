import paymentPage from '../pageObject/PageObject';
describe('Make Payment than Cancel and retry', () => {
    let order_id;
    let creditPoints;
    let initialCreditPoints;
    let trimmedToken;
    let paymentMethodId;
    let total_due;
    let paymentData;

    // Read the idToken from the file before running the tests
    before(() => {
        cy.readFile('cypress/fixtures/idToken.txt').then((idToken) => {
            trimmedToken = idToken.trim();
        });
    });

    const initializePaymentMethodId = () => {
        paymentMethodId = 2; // Set paymentMethodId here or fetch it from somewhere
    };

    before(() => {
        initializePaymentMethodId(); // Call the function to initialize paymentMethodId
    });

    it('should make payment and cancel', () => {
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

                    // Fetch user data again to check updated credit balance after payment
                    paymentPage.getCurrentUserData(trimmedToken).then(userDataAfterPaymentResponse => {
                        const creditPointsAfterPayment = userDataAfterPaymentResponse.credit_points;
                        cy.log('Your Credit Balance After Payment is:', creditPointsAfterPayment);

                        paymentPage.cancelPayment(trimmedToken, order_id).then(cancelpaymentResponse => {
                            cy.printResponse(cancelpaymentResponse);
                        });
                    });
                });
            }).then(null, (error) => {
            });
        });
    });

    it('should make payment and cancel again', () => {
        // Make payment again using page object method
        cy.makePayment(trimmedToken, order_id, creditPoints, total_due, paymentMethodId).then((paymentData) => {
            cy.printResponse(paymentData);

            paymentPage.cancelPayment(trimmedToken, order_id).then(cancelpaymentResponse => {
                cy.printResponse(cancelpaymentResponse);
            });
        });
    });

    it('should make payment again', () => {
        cy.wrap(null).should(() => {
            expect(order_id).to.not.be.undefined;
            expect(creditPoints).to.not.be.undefined;
            expect(total_due).to.not.be.undefined;
            expect(paymentMethodId).to.not.be.undefined;
        });
        // Make payment again using page object method
        cy.makePayment(trimmedToken, order_id, creditPoints, total_due, paymentMethodId).then((paymentData) => {
            cy.printResponse(paymentData);
        });
    });

    it('should visit url', () => {   
        paymentPage.navigateToCreditCardPaymentURL_success(paymentData);
    });

    it('Query the database and read payment status', () => {
        paymentPage.queryAllPaymentStatus(order_id);
    });

    it('Query the database for refund', () => {
        paymentPage.queryAllRefunds(order_id, creditPoints);
    });
});
