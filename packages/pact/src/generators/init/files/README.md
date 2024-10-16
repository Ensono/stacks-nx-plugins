# Pact Consumer Tests
Pact is an open-source testing framework that enables consumer-driven contract testing between service providers and service consumers. Pactflow is a cloud-based platform for implementing and managing contract testing using the Pact framework. 

The tests are using a mock of this [spec](https://github.com/OAI/OpenAPI-Specification/blob/main/examples/v3.0/petstore.yaml).

An example of a provider repository can be found [here](https://github.com/Ensono/stacks-pacts-provider-pipeline)


## Adapting the tests for your application

The tests use an example API and requestClient in the [src/api directory](./src/api/). These can be replaced with the actual API and requestClient of your application.

### Amend the mock API
Amend the mock API in the [src/mock directory](./src/mock/) to match the API of your application. The `mockData.ts` contains the mock API responses, and the handlers in the `handlers.ts` file define the mock API endpoints.

### Configure the pact adapter
The consumer, provider and endpoints will need to be configured in the [pactAdapter](./src/mock/pactAdapter.ts). The provider name will need to match the name for the provider in Pactflow.

### Update the tests
The tests in the [test directory](./test/) will need to be updated to match the API of your application. The tests define the interactions between the consumer and provider, and the expected responses from the provider.

### Configure Pactflow
A [Pactflow](https://pactflow.io/) account will need to be set up.

### Update the pipelines
There is an example ADO and GitHub Actions pipeline. These will need to be updated with any environment variables and secrets required for your application, plus any additional build and deploy steps your application requires. You can remove the pipeline file that you are not using.


## Setting up your local environment

### Install dependencies
Run `npm install`

### Set environment variables
Set the following environment variables to the correct values:
* export API_BASE_URL=${API_BASE_URL} (e.g. http://localhost:3000)
* export DEBUG=false

These can also be set by creating a `.env` file and adding the following:

```
API_BASE_URL=${API_BASE_URL}
DEBUG=false
```

### Running the tests
Run `npm run test` to run all tests in the [test directory](./test/).

Set the `DEBUG` environment variable to `true` to see the msw logs when running the tests.


## Generating the pact
A pact is generated in in the [msw_generated_pacts](./msw_generated_pacts/) directory after running the tests.

The test scenarios in the [test directory](./test/) define the rules in the pact, so any changes to the tests will result in changes to the pact.


## Publishing the pact
The pipeline is set up to deploy the pact to the pact broker and run `can-i-deploy` checks. If the pact is compatible with the provider's OpenApi specification, then the `can-i-deploy` check will succeed and the application can be deployed.

The `API_BASE_URL` environment variable and `PACT_BROKER_TOKEN` secret will need to be set in the the repository for the pipelines to read.

Two environment variables will need to be set in the `env` property in the `publish-pact.yml`/`ado_build.yml` file:
* `PACT_BROKER_BASE_URL`
* `PACTICIPANT_NAME`


These values can be found in the Pactflow UI.
