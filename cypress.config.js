const { defineConfig } = require("cypress");
const { Client } = require("pg");
const fs = require("fs").promises; // Using fs.promises for async/await support

module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        async queryDb(query) {
          const client = new Client({
            user: "admin_dev",
            host: "postgres-rds-dev.csu96jydgrqc.ap-southeast-1.rds.amazonaws.com",
            database: "every",
            password: "JHsud7ehjdks#",
            port: 5432,
            ssl: true,
          });

          try {
            await client.connect();
            const result = await client.query(query);
            // Write to file
            const path = "cypress/fixtures/query-results.json";
            await fs.writeFile(path, JSON.stringify(result.rows, null, 2));
            return `Query results written to ${path}`;
          } catch (error) {
            console.error("An error occurred:", error.message);
            throw error; // Rethrow the error to handle it in the test assertions
          } finally {
            await client.end(); // Ensure client disconnects in all scenarios
            console.log("Database disconnected");
          }
        },
      });
      return config;
    },

    reporter: "mochawesome",
    reporterOptions: {
      reportDir: "cypress/reports", // check if this directory exists or has correct permissions
      overwrite: false,
      html: true, // ensures HTML report isn't generated
      json: true, // ensures JSON report is generate
    },
    baseUrl: "https://app-dev.iimmpact.com/v1",
  },

  env: {
    phoneNumber: "+919630933393", // Default phone number, can be overridden through command line
  },
};
