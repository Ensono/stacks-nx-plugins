
# Rest Client

  

This library is a NX plugin. Please see further documentation on NX plugins

[here](https://nx.dev/plugin-features/create-your-own-plugin)

  

### What is its purpose?

This plugin provides the ability to quickly get up and running with http clients and endpoints. One can generate the basic HTTP methods required to start building out a project.

### What benefits does it give you?
-   Helps track versioning and easily bump versions of endpoints using one of the plugins.
-   Ensure solid foundational syntax accuracy
-   Promote best practice in generated code


## How to Get Started

Install the @ensono-stacks/rest-client with the following command:

### NPM
```
npm install --save-dev @ensono-stacks/rest-client@latest
```
### Yarn
```
yarn  add  --dev @ensono-stacks/rest-client
```

## Generators and Executors

To see a list of the plugin capabilities run the following command:

```bash
nx list @ensono-stacks/rest-client
```

View additional information about a plugin capability through the following command:

```bash
nx g @ensono-stacks/rest-client:[generator-executor-name] --help
```

### @ensono-stacks/rest-client:http-client

This plugin installs Axios and configures a new instance of the provider ready to be customised and consumed via your project.

####  Usage
```bash
nx g @ensono-stacks/rest-client:http-client
```

#### Command line arguments

The following command line arguments are available:

| Option | Description | Type | Accepted Values | Default | Required |
| ------------ | --------------------------------------------------------------- | ------- | --------------- | ------- | -------- |
| --name | Library name | string | | | true |
| --directory | Subdirectory inside libs/ where the generated library is placed | string | | | |
| --importPath | What import path would you like to use for the library | string | | | |
| --tags | Add tags to the library (used for linting) | string | | | |
| --skipFormat | Skip formatting files | boolean | | false | |

#### Generator output
The http-client will create a new library within your libs folder for the axios http client:

```text
├── http-client
│ ├── src
│ │ ├── index.ts
│ │ ├── index.test.ts
│ ├── README.md
│ ├── tsconfig.json
│ ├── tsconfig.lib.json
│ ├── project.json
│ ├── .eslintrc.json
│ ├── jest.config.ts
└── └── tsconfig.spec.json
```
Additionally, the package.json will be updated with the axios dependency.

```text
├── root
│ ├── tsconfig.base.json
└── └──package.json
```
In order to import the http-client into your application a new entry for the client is added to the tsconfig.base.json "paths"

```json
"paths": {
	"@<workspace-name>/http-client": [
		"libs/http-client/src/index.ts"
	]
}
```

### @ensono-stacks/rest-client:client-endpoint
Add Axios HTTP methods to your existing application.

This plugin gives you choice of selecting from the HTTP methods using Axios as the provider for setting up the initial building blocks of your new endpoint.

#### Prerequisites
This generator requires a _http-client_ project to be available.

####  Usage
```bash
nx g @ensono-stacks/rest-client:client-endpoint
```

####  Command line arguments

The following command line arguments are available:

| Option | Description | Type | Accepted Values | Default | Required |
| ----------------- | ---------------------------------------------------------------------------------------------- | ------ | -------------------------------------------- | ------- | -------- |
| --name | Library name | string | | | true |
| --httpClient | The import path of the previously generated http-client used in the application | string | | | true |
| --envVar | The name of the API url environment variable | string | | API_URL | true |
| --endpointVersion | The version of the endpoint | number | | 1 | true |
| --methods | List of HTTP methods to be generated. Choose from get, post, patch, put, delete, head, options | array | get, post, patch, put, delete, head, options | | true |
| --directory | Subdirectory inside libs/ where the generated library placed | string | | | |
| --tags | Add tags to the project (used for linting) | string | | | |

####  Generator Output

The client-endpoint will create a new library within your libs folder, using your answer to the 'What is the import path of your previously generated http-client library?' to import the previously created http-client into your client endpoint:

```text
└── libs
│ ├── client-endpoint
│ │ ├── V1
│ │ │ ├── README.md
│ │ │ ├── src
│ │ │ │ ├── index.ts
│ │ │ │ ├── index.test.ts
│ │ │ │ ├── index.types.ts
│ │ │ ├── tsconfig.json
│ │ │ ├── tsconfig.lib.json
│ │ │ ├── project.json
│ │ │ ├── .eslintrc.json
│ │ │ ├── jest.config.ts
└───└───└───└── tsconfig.spec.json
└── .env.local
```

Be sure to add the API_URL as an environment variable to the created .env.local file for local development

In order to import the client-endpoint into your application a new entry for the client is added to the tsconfig.base.json "paths"

```json
"paths": {
	"@<workspace-name>/client-endpoint/v1": [
		"libs/client-endpoint/v1/src/index.ts"
	]
}

```

### @ensono-stacks/rest-client:bump-version

This plugin reads any existing endpoints and creates a new directory for the specified new version with the files contained within the previous version.

####  Prerequisites

This generator requires a _client-endpoint_ project to be available.

####  Usage
```bash
nx g @ensono-stacks/rest-client:bump-version
```

###  Command line arguments

The following command line arguments are available:

| Option | Description | Type | Accepted Values | Default | Required |
| ----------------- | --------------------------------------------------------------------------------------------- | ------ | --------------- | ------- | -------- |
| --name | The endpoint name you want to bump | string | | | true |
| --directory | Subdirectory inside libs/ where the generated endpoint is placed | string | | | |
| --endpointVersion | The version you want to bump your endpoint. Omitting this value will bump latest version + 1. | number | | | |

####  Generator Output

The generator will take a copy of your **latest** endpoint and bump it to the next version (unless overridden through the --endpointVersion argument)

```text
├── client-endpoint
│ ├── v1
│ │ ├── README.md
│ │ │ ├── src
│ │ │ │ ├── index.ts
│ │ │ │ ├── index.test.ts
│ │ │ │ ├── index.types.ts
│ │ │ ├── tsconfig.json
│ │ │ ├── tsconfig.lib.json
│ │ │ ├── project.json
│ │ │ ├── .eslintrc.json
│ │ │ ├── jest.config.ts
└───└───└───└── tsconfig.spec.json
```
Once the `bump-version` generator has been used, your library structure will look similar to the following:

```text title="Bumped endpoint structure"

├── client-endpoint

│ ├── v1

│ │ ├── [...]

│ ├── v2

│ │ ├── README.md

│ │ │ ├── src

│ │ │ │ ├── index.ts

│ │ │ │ ├── index.test.ts

│ │ │ │ ├── index.types.ts

│ │ │ ├── tsconfig.json

│ │ │ ├── tsconfig.lib.json

│ │ │ ├── project.json

│ │ │ ├── .eslintrc.json

│ │ │ ├── jest.config.ts

└───└───└───└── tsconfig.spec.json

```
In order to import the bumped client-endpoint into your application a new entry for the client is added to the tsconfig.base.json "paths"
```json
"paths": {
	"@<workspace-name>/client-endpoint/v2": [
		"libs/client-endpoint/v2/src/index.ts"
	]
}
```

## Full documentation


Please visit the stacks documentation page for `rest-client`

[here](https://stacks.amido.com/docs/nx/rest-client/ensono-stacks-rest-client) for more information
