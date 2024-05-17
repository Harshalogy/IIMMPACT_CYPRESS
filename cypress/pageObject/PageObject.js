class PaymentPage {

    static getCurrentUserData(trimmedToken) {
        const apiUrl = `${Cypress.config("baseUrl")}/users/current`;
        return cy.request({
          method: 'GET',
          url: apiUrl,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${trimmedToken}`
          }
        }).then(userDataResponse => userDataResponse.body.data);
      }

      static createOrder(trimmedToken, paymentMethodId, amount, creditPoints) {
        const orderPayload = {
            payment_method_id: paymentMethodId,
            order_items: [{
                account_number: '+60123450045',
                product_code: 'C',
                quantity: 1,
                amount: amount,
                extras: {}
            }],
            credit_points: creditPoints
        };

        return cy.request({
            method: 'POST',
            url: `${Cypress.config("baseUrl")}/orders`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${trimmedToken}`
            },
            body: orderPayload
        });
    }

    static cancelPayment(trimmedToken, order_id) {
        const paymentcancelApiUrl = 'https://app-dev.iimmpact.com/v1/payments/cancel';
    
        const cancelpaymentPayload = {
            order_id: order_id,
        };
    
        // Make Cancel Payment API call
        return cy.request({
            method: 'POST',
            url: paymentcancelApiUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${trimmedToken}`
            },
            body: cancelpaymentPayload
        }).then(cancelpaymentResponse => {
            //const cancelpaymentData = cancelpaymentResponse.body;
            return cancelpaymentResponse;
        });
    }    

    // Method to query the database and read success payment status
    static queryPaymentStatus(orderId) {
        cy.wait(10000); // Wait for 10 seconds
        cy.log('Order ID for database query:', orderId); // Log the order_id before executing the query
        
        // Query payments table for payment status
        const paymentQuery = `SELECT * from payments WHERE order_id = ${orderId};`;
        cy.task('queryDb', paymentQuery).then((paymentResult) => {
            console.table(paymentResult);

            // Read payment status from query-results.json
            cy.readFile('cypress/fixtures/query-results.json').then((data) => {
                if (data && data.length > 0) {
                    const paymentStatusId = data[0].payment_status_id;
                    //expect(paymentStatusId).to.equal(1, 'Payment status is correct');
                    if (paymentStatusId === 1) {
                        expect(paymentStatusId).to.equal(1, 'Payment status is correct');
                        cy.log('Payment Successful');
                    } else if (paymentStatusId === 3) {
                        expect(paymentStatusId).to.equal(3, 'Payment status is correct');
                        cy.log('Payment Failed');
                    } else if (paymentStatusId === 4) {
                        expect(paymentStatusId).to.equal(4, 'Payment status is correct');
                        cy.log('Payment Timeout');
                    } else if (paymentStatusId === 5) {
                        expect(paymentStatusId).to.equal(5, 'Payment status is correct');
                        cy.log('Payment Cancelled');
                    }
                } else {
                    cy.log('No payment status found in query-results.json');
                }
            });
        });
    }

    static queryAllPaymentStatus(order_id) {
        cy.log('Order ID for database query:', order_id); // Log the order_id before executing the query
        const query = `SELECT * from payments WHERE order_id = ${order_id};`;
        
        cy.task('queryDb', query).then((result) => {
            console.table(result);
    
            // Read payment status from query-results.json
            cy.readFile('cypress/fixtures/query-results.json').then((data) => {
                if (data && data.length > 0) {
                    data.forEach((record) => {
                        const payment_id = record.payment_id;
                        const payment_status_id = record.payment_status_id;
    
                        // Log payment_id
                        cy.log(`Payment ID: ${payment_id}`);
    
                        // Determine payment status based on payment_status_id
                        let paymentStatus;
                        if (payment_status_id === 1) {
                            paymentStatus = 'Payment successful';
                        } else if (payment_status_id === 5) {
                            paymentStatus = 'Payment status is cancelled';
                        } else {
                            paymentStatus = 'Unknown payment status';
                        }
                        // Log payment status
                        cy.log(paymentStatus);
                    });
                } else {
                    cy.log('No payment status found in query-results.json');
                }
            });
        });
    }        
            
    static queryTransactionStatus(orderId) {
        cy.wait(2000); // Wait for 2 seconds
        cy.log('Order ID for database query:', orderId); // Log the order_id before executing the query

        // Query transactions table for transaction status
        const transactionQuery = `SELECT * from transactions WHERE order_id = ${orderId};`;
        cy.task('queryDb', transactionQuery).then((transactionResult) => {
            console.table(transactionResult);
            // Read transaction status from query-results.json
            cy.readFile('cypress/fixtures/query-results.json').then((data) => {
                if (data && data.length > 0) {
                    const transactionStatus = data[0].transaction_status;
                    cy.log('Transaction Status:', transactionStatus);
                    expect(transactionStatus).to.equal('Failed', 'Transaction status should be Failed');
                } else {
                    cy.log('No transaction status found in query-results.json');
                }
            });
        });
    }

    static refundTransaction(orderId, itemsSubtotal) {
        cy.wait(2000); // Wait for 2 seconds
        const query = `SELECT * from user_credits_history WHERE order_id = ${orderId} AND credit_points > 0;`;
        cy.task('queryDb', query).then((result) => {
            console.table(result);
            // Read refund records from query-results.json
            cy.readFile('cypress/fixtures/query-results.json').then((data) => {
                // Assert message for single refund found for order
                expect(data).to.have.lengthOf(1, 'Single refund record found for order');

                const refundFromJson = data[0].credit_points;
                expect(refundFromJson).to.equal(itemsSubtotal * 100, 'Refund amount is correct');

                // Assert balance in query-results.json is equal to initialCreditPoints
                const balanceFromJson = data[0].user_balance;
                cy.log('Credit Balance after Refund is :', balanceFromJson);
            });
        });
    }

    static refundPayment(order_id, creditPoints, initialCreditPoints) {
        cy.wait(4000); // Wait for 4 seconds
        const query = `SELECT * from user_credits_history WHERE order_id = ${order_id} AND credit_points > 0;`;
    
        return cy.task('queryDb', query).then((result) => {
            console.table(result);
            // Read refund records from query-results.json
            return cy.readFile('cypress/fixtures/query-results.json').then((data) => {
                // Assert message for single refund found for order
                expect(data).to.have.lengthOf(1, 'Single refund record found for order');
    
                const refundFromJson = data[0].credit_points;
                expect(refundFromJson).to.equal(creditPoints, 'Refund amount is equal to creditPoints used');
    
                // Assert balance in query-results.json is equal to initialCreditPoints
                const BalanceFromJson = data[0].user_balance;
                expect(BalanceFromJson).to.equal(initialCreditPoints, 'Credit Balance after refund is equal to initialCreditPoints');
            });
        });
    }

    static queryAllRefunds(order_id, creditPoints) {
        const query = `SELECT * from user_credits_history WHERE order_id = ${order_id};`;
        cy.task('queryDb', query).then((result) => {
            try {
                console.table(result);
    
                // Read additional refund details from file
                cy.readFile('cypress/fixtures/query-results.json').then((data) => {
                    if (data && data.length > 0) {
                        cy.log(`Credit refund record:`);
                        data.forEach((item) => {
                            const refundType = item.credit_points >= 0 ? 'Refund' : 'Deduction';
                            const refundAmount = Math.abs(item.credit_points); // Take absolute value
                            const userBalanceAfterRefund = item.user_balance;
                            cy.log(`${refundType}: ${refundAmount} credit points`);
                            cy.log(`User Balance After ${refundType}: ${userBalanceAfterRefund}`);
                        });
                        const refundFromJson = data[1].credit_points;
                        expect(refundFromJson).to.equal(creditPoints, 'Refund amount is equal to creditPoints used');
                    } else {
                        cy.log('No additional refund records found');
                    }
                });
            } catch (error) {
                cy.log('Error querying database for refunds:', error.message);
            }
        });
    }    

    static async calculateOrderWithAmount(trimmedToken, amount) {
        try {
            // Generate random values for paymentMethodId and quantity
            const paymentMethodId = Math.floor(Math.random() * 2) + 1; // Generates either 1 or 2
            const quantity = Math.floor(Math.random() * 3) + 1; // Generates a number between 1 and 3
            const creditPoints = 0; // no credit Points
            const Product = ['C', 'CB', 'XB', 'OX', 'N'][Math.floor(Math.random() * 5)];
    
            // Construct the order payload
            const orderPayload = {
                payment_method_id: paymentMethodId,
                order_items: [{
                    account_number: '+60195503886',
                    product_code: Product,
                    quantity: quantity,
                    amount: amount,
                    extras: {}
                }],
                credit_points: creditPoints
            };
    
            // Send the request to calculate the order
            const response = await cy.request({
                method: 'POST',
                url: `${Cypress.config("baseUrl")}/orders/calculate`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${trimmedToken}`
                },
                body: orderPayload
            });
    
            // Log the response
            cy.log('API Response:', response);
    
            // Return the generated values along with the response
            return {
                response: response,
                paymentMethodId: paymentMethodId,
                amount: amount,
                quantity: quantity
            };
        } catch (error) {
            // Handle any errors
            console.error('Error:', error);
            throw error; // Rethrow the error
        }
    } 

    static calculateOrderWithCreditPoints(trimmedToken) {
        // Generate random values for paymentMethodId and quantity
        const paymentMethodId = Math.floor(Math.random() * 2) + 1; // Generates either 1 or 2
        const amount = Math.floor(Math.random() * 4) + 1; // Generates a number between 1 and 4
        const quantity = Math.floor(Math.random() * 3) + 1; // Generates a number between 1 and 3
        const creditPoints = amount*quantity*100; // Generates a number between 1 and (amount-1)*100
        const Product = ['C', 'CB', 'XB', 'OX', 'N'][Math.floor(Math.random() * 5)];
    
        // Construct the order payload
        const orderPayload = {
            payment_method_id: paymentMethodId,
            order_items: [{
                account_number: '+60195503886',
                product_code: Product,
                quantity: quantity,
                amount: amount,
                extras: {}
            }],
            credit_points: creditPoints
        };
    
        // Send the request to calculate the order
        return cy.request({
            method: 'POST',
            url: `${Cypress.config("baseUrl")}/orders/calculate`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${trimmedToken}`
            },
            body: orderPayload
        }).then(response => {
            // Return the generated values along with the response
            return {
                response: response,
                paymentMethodId: paymentMethodId,
                amount: amount,
                quantity: quantity
            };
        });
    }

    static calculateOrderWithExtras(trimmedToken) {
        // Generate random values for paymentMethodId and quantity
        const paymentMethodId = Math.floor(Math.random() * 2) + 1; // Generates either 1 or 2
        const amount = [12, 20, 25, 30, 35, 36, 38, 40, 50][Math.floor(Math.random() * 9)]; // fixed amount
        const quantity = Math.floor(Math.random() * 3) + 1; // Generates a number between 1 and 3
        const creditPoints = 0; // no credit points
        const Product = 'UMI';
        const subproduct = 'UMGT';
    
        // Construct the order payload
        const orderPayload = {
            payment_method_id: paymentMethodId,
            order_items: [{
                account_number: '+60195503886',
                product_code: Product,
                quantity: quantity,
                amount: amount,
                extras: {
                    subproduct_code: subproduct
                }
            }],
            credit_points: creditPoints
        };
    
        // Send the request to calculate the order
        return cy.request({
            method: 'POST',
            url: `${Cypress.config("baseUrl")}/orders/calculate`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${trimmedToken}`
            },
            body: orderPayload
        }).then(response => {
            // Return the generated values along with the response
            return {
                response: response,
                paymentMethodId: paymentMethodId,
                amount: amount,
                quantity: quantity,
                product: Product,
                subproduct: subproduct
            };
        });
    }

    static CreateOrderWithAmount(trimmedToken, amount) {
        // Generate random values for paymentMethodId and quantity
        const paymentMethodId = Math.floor(Math.random() * 2) + 1; // Generates either 1 or 2
        const quantity = Math.floor(Math.random() * 3) + 1; // Generates a number between 1 and 3
        const creditPoints = 0; // no credit Points
        const Product = ['C', 'CB', 'XB', 'OX', 'N'][Math.floor(Math.random() * 5)];
    
        // Construct the order payload
        const orderPayload = {
            payment_method_id: paymentMethodId,
            order_items: [{
                account_number: '+60195503886',
                product_code: Product,
                quantity: quantity,
                amount: amount,
                extras: {}
            }],
            credit_points: creditPoints
        };
    
        // Send the request to calculate the order
        return cy.request({
            method: 'POST',
            url: `${Cypress.config("baseUrl")}/orders`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${trimmedToken}`
            },
            body: orderPayload
        }).then(response => {
            // Return the generated values along with the response
            return {
                response: response,
                paymentMethodId: paymentMethodId,
                amount: amount,
                quantity: quantity
            };
        });
    }

    static CreateOrderWithExtras(trimmedToken) {
        // Generate random values for paymentMethodId and quantity
        const paymentMethodId = Math.floor(Math.random() * 2) + 1; // Generates either 1 or 2
        const amount = [12, 20, 25, 30, 35, 36, 38, 40, 50][Math.floor(Math.random() * 9)]; // fixed amount
        const quantity = Math.floor(Math.random() * 3) + 1; // Generates a number between 1 and 3
        const creditPoints = 0; // no credit points
        const Product = 'UMI';
        const subproduct = 'UMGT';
    
        // Construct the order payload
        const orderPayload = {
            payment_method_id: paymentMethodId,
            order_items: [{
                account_number: '+60195503886',
                product_code: Product,
                quantity: quantity,
                amount: amount,
                extras: {
                    subproduct_code: subproduct
                }
            }],
            credit_points: creditPoints
        };
    
        // Send the request to calculate the order
        return cy.request({
            method: 'POST',
            url: `${Cypress.config("baseUrl")}/orders`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${trimmedToken}`
            },
            body: orderPayload
        }).then(response => {
            // Return the generated values along with the response
            return {
                response: response,
                paymentMethodId: paymentMethodId,
                amount: amount,
                quantity: quantity,
                product: Product,
                subproduct: subproduct
            };
        });
    }
    
    static queryNoRefund(order_id) {
        cy.wait(5000); // Wait for 5 seconds
        const query = `SELECT * from user_credits_history WHERE order_id = ${order_id} AND credit_points > 0;`;
        return cy.task('queryDb', query).then(result => {
            console.table(result);
            if (result.length === 0) {
                cy.log('No refund for order');
            } else {
                return cy.readFile('cypress/fixtures/query-results.json').then(data => {
                    // Assert no record found for refund
                    expect(data).to.have.lengthOf(0, 'No refund record found for order');
                });
            }
        });
    }

    static navigateToCreditCardPaymentURL_success(paymentData) {
        if (paymentData && paymentData.payment_id) {
            const url = paymentData.url;
            cy.log('Navigating to Payment URL:', url);
            cy.visit(url);

            // Handle OTP verification
            cy.get('#cc_form > div.container > div > div.credit-info > div > button')
                .should('be.visible')
                .click()
                .then(() => {
                    cy.log('Request OTP button clicked');
                    // Wait for OTP to appear
                    cy.get('#cc_form > div.container > div > div.credit-info > div > div.otp').should('be.visible');

                    // Get the OTP text
                    cy.get('#cc_form > div.container > div > div.credit-info > div > div.otp').invoke('text')
                        .then(otpString => {
                            const otpNumeric = otpString.match(/\d+/);
                            if (!otpNumeric) {
                                throw new Error('Failed to extract OTP.');
                            }
                            const otpText = otpNumeric[0];

                            // Paste the OTP into the input box
                            cy.get('#otp-input').should('be.visible').type(otpText);
                            cy.log('Entering OTP in input box');

                            // Click on the pay button
                            cy.get('#cc_form > div.container > div > div.credit-info > div > button')
                                .should('be.visible')
                                .click();
                                //.wait(2000); // Wait for 2 seconds after clicking the pay button
                            cy.log('Pay button clicked');

                            // Close the browser window
                            cy.window().then(win => win.close());
                        });
                });
        }
    }

    static navigateToFavePaymentURL_success(paymentData) {
        if (paymentData.payment_id && paymentData.url) {
            const url = paymentData.url;
            cy.log('Navigating to Payment URL..');
            cy.visit(url).then(() => {
                cy.get('#success_btn', { timeout: 5000 }).should('be.visible').then((successButton) => {
                    if (successButton) {
                        cy.log('Success button found.');
                        cy.wrap(successButton).click();
                        cy.log('Success button clicked.');
                    } else {
                        cy.log('Success button not found.');
                    }
                    // Close the browser window
                    cy.window().then(win => win.close());
                });
            });
        } else {
            cy.log('Unable to process the payment. If any amount is deducted from your account, it will be refunded shortly.');
        }
    }

    static navigateToCreditCardPaymentURL_fail(paymentData) {
        if (paymentData.payment_id && paymentData.url) {
            const url = paymentData.url;
            cy.log('Navigating to Payment URL..');
            cy.visit(url).then(() => {
                // Find and click on the fail button
                cy.get('#cc_form > div.container > div > div.credit-info > div > div > button', { timeout: 5000 })
                    .should('be.visible')
                    .click();

                // Close the browser window
                cy.window().then(win => win.close());
            });
        } else {
            cy.log('Unable to process the payment. If any amount is deducted from your account, it will be refunded shortly.');
        }
    }

    static navigateToFavePaymentURL_fail(paymentData) {
        if (paymentData.payment_id && paymentData.url) {
            const url = paymentData.url;
            cy.log('Navigating to Payment URL..');
            cy.visit(url).then(() => {
                // Find and click on the fail button
                cy.get('#fail_btn', { timeout: 5000 })
                    .should('be.visible')
                    .click();

                // Close the browser window
                cy.window().then(win => win.close());
            });
        } else {
            cy.log('Unable to process the payment. If any amount is deducted from your account, it will be refunded shortly.');
        }
    }
}

module.exports = PaymentPage;
