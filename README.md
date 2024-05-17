Running Cypress Tests
Follow these steps to set up and run the Cypress tests:

Clone the repository: git clone <repository-url>

Navigate to the project directory:
cd <project-directory>
Replace <project-directory> with the actual name of the folder into which the repository has been cloned.

Install Cypress and rimraf:
npm install cypress --save-dev

npm install --save-dev rimraf

Clean the reports and screenshots:
Before new test runs, clean out the existing reports and screenshots using this command:
npm run clean:reports

Run the Cypress tests:
Execute your Cypress tests with the following command:
npm run cypress:run

Generate HTML report:
Once test execution is complete, merge the results and generate an HTML report by running:
npm run postcypress:run
