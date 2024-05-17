Cypress.Commands.add("sendOTP", (phoneNumber) => {
  return cy
    .request({
      method: "POST",
      url: `${Cypress.config("baseUrl")}/authorize/send-otp`,
      body: { phone_number: phoneNumber, comm_channel: "sms" },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      cy.log("OTP sent successfully");
      return cy.wrap(response.body.data.session_id);
    });
});

Cypress.Commands.add("verifyOTP", (phoneNumber, sessionId, otp = "1234") => {
  return cy
    .request({
      method: "POST",
      url: `${Cypress.config("baseUrl")}/authorize/verify-otp`,
      body: { phone_number: phoneNumber, otp, session_id: sessionId },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      cy.log("OTP verified successfully");
      return cy.wrap(response.body.data.refresh_token);
    });
});

Cypress.Commands.add("refreshToken", (phoneNumber, refreshToken) => {
  return cy
    .request({
      method: "POST",
      url: `${Cypress.config("baseUrl")}/token/refresh`,
      body: {
        refresh_token: refreshToken,
        phone_number: phoneNumber,
      },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      cy.writeFile("cypress/fixtures/idToken.txt", response.body.data.id_token);
      cy.log("Token saved to file successfully");
      // If you expected to chain from here, wrap the value. If not, wrapping here is optional
    });
});

Cypress.Commands.add(
  "validateResponse",
  (paymentMethodId, orderData, amount, quantity) => {
    cy.log("Validating the calculation of Response.......");
    cy.log("Payment Method ID chosen:", paymentMethodId);
    expect(orderData.data.payment_method_id).to.eq(paymentMethodId);

    if (paymentMethodId === 1) {
      cy.validatePaymentMethod1(orderData.data, amount, quantity);
    } else if (paymentMethodId === 2) {
      cy.validatePaymentMethod2(orderData.data, amount, quantity);
    } else {
      throw new Error("Invalid payment method ID: " + paymentMethodId);
    }
  }
);

Cypress.Commands.add("validatePaymentMethod1", (data, amount, quantity) => {
  expect(data.payment_method_name, "Payment method is correct").to.eq("Fave");
  expect(data.payment_method_fee, "Payment method fee is correct").to.eq(
    0.0239
  );
  expect(data.credit_discount_value, "Credit discount value is correct").to.eq(
    data.credit_points_used / 100
  );
  expect(data.items_subtotal, "Item subtotal is correct").to.eq(
    parseFloat((amount * quantity).toFixed(2))
  );
  expect(data.payable_amount.toFixed(2), "Payable amount is correct").to.eq(
    (data.items_subtotal - data.credit_points_used / 100).toFixed(2)
  );
  expect(data.payment_fee, "Payment fee is correct").to.eq(
    parseFloat(
      (
        (data.items_subtotal - data.credit_points_used / 100) *
        data.payment_method_fee
      ).toFixed(2)
    )
  );
  expect(data.total_due, "Total due is correct").to.eq(
    parseFloat(
      (
        data.items_subtotal -
        data.credit_points_used / 100 +
        (data.items_subtotal - data.credit_points_used / 100) *
          data.payment_method_fee
      ).toFixed(2)
    )
  );
});

Cypress.Commands.add("validatePaymentMethod2", (data, amount, quantity) => {
  expect(data.payment_method_name, "Payment method is correct").to.eq(
    "Credit Cards"
  );
  expect(data.payment_method_fee, "Payment method fee is correct").to.eq(
    0.0179
  );
  expect(data.credit_discount_value, "Credit discount value is correct").to.eq(
    data.credit_points_used / 100
  );
  expect(data.items_subtotal, "Item subtotal is correct").to.eq(
    parseFloat((amount * quantity).toFixed(2))
  );
  expect(data.payable_amount.toFixed(2), "Payable amount is correct").to.eq(
    (data.items_subtotal - data.credit_points_used / 100).toFixed(2)
  );
  expect(data.payment_fee, "Payment fee is correct").to.eq(
    parseFloat(
      (
        (data.items_subtotal - data.credit_points_used / 100) *
        data.payment_method_fee
      ).toFixed(2)
    )
  );
  expect(data.total_due, "Total due is correct").to.eq(
    parseFloat(
      (
        data.items_subtotal -
        data.credit_points_used / 100 +
        (data.items_subtotal - data.credit_points_used / 100) *
          data.payment_method_fee
      ).toFixed(2)
    )
  );
});

Cypress.Commands.add("compareQueryResults", (order_id, order_item_id, Quantity, amount) => {
  cy.log('Order ID for database query:', order_id);
  const query = `SELECT * from order_items WHERE order_id = ${order_id};`;
  cy.task('queryDb', query).then((result) => {
      console.table(result);
  });
  cy.readFile('cypress/fixtures/query-results.json').then((data) => {
      const orderDataDB = data[0];

      const {
          order_id: orderIdFromJson,
          order_item_id: orderItemIdFromJson,
          quantity: quantityFromJson,
          denomination: denominationFromJson,
          price: priceFromJson
      } = orderDataDB;

      expect(orderIdFromJson, 'order_id is correct').to.equal(order_id);
      expect(orderItemIdFromJson, 'order_item_id is correct').to.equal(order_item_id);
      expect(quantityFromJson, 'quantity is correct').to.equal(Quantity);
      expect(denominationFromJson.toString(), 'denomination is correct').to.include(amount.toString());
      expect(priceFromJson.toString(), 'price is correct').to.include(amount.toString());
  });
});

Cypress.Commands.add("printResponse", (response) => {
  cy.log('API response:', JSON.stringify(response.body));
});

Cypress.Commands.add('makePayment', (trimmedToken, order_id, creditPoints, total_due, paymentMethodId) => {
  const paymentPayload = {
      order_id: order_id,
      credit_points: creditPoints,
      payment_total: total_due,
      payment_method_id: paymentMethodId, // Assign the paymentMethodId to the payment_method_id field
      payment_details: {
          card_number: "4111111111111111",
          card_cvv: "111",
          card_month_expiry: "12",
          card_year_expiry: "25"
      }
  };

  return cy.request({
      method: 'POST',
      url: `${Cypress.config("baseUrl")}/payments`,
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${trimmedToken}`
      },
      body: paymentPayload
  }).then(response => {
      // Return the response as paymentData
      return response.body.data;
  });
});

Cypress.Commands.add('PaymentsTimeout', (payment_id) => {
  const timeoutApiUrl = `http://topup-inlb-dev-352295c92d3f1f7f.elb.ap-southeast-1.amazonaws.com:93/general/b2c/payments/process-pending-payments.php?payment_id=${payment_id}`;
  return cy.request(timeoutApiUrl);
});
