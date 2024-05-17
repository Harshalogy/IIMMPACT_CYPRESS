describe("Login User", () => {
  it("successfully logs in and retrieves ID token", () => {
    const phoneNumber = Cypress.env("phoneNumber");
    cy.sendOTP(phoneNumber).then((sessionId) => {
      cy.verifyOTP(phoneNumber, sessionId).then((refreshToken) => {
        // Ensure that all Cypress commands are queued and callback does not return anything externally.
        cy.refreshToken(phoneNumber, refreshToken);
      });
    });
  });
});
