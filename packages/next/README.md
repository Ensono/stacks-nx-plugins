
# Next
This library is a NX plugin. Please see further documentation on NX plugins

[here](https://nx.dev/plugin-features/create-your-own-plugin)

 ## What is its purpose?
 
The  `next`  plugin contains generators to augment existing NextJs projects. Adding eslint rules, testing config as well as installing and configuring NextAuth.js in your NextJs app.

Using a standard setup for your Next app ensures consistency and code quality across multiple applications quickly. NextAuth (alongside Redis) can also be quickly added to a project without costly configuration and setup.

Using the infrastructure generator you can setup your application with the necessary infrastructure config to host it in k8s, with optional OpenTelemetry auto instrumentation.
 
 ## Prerequisites

An existing  [Next](https://nextjs.org/)  application. Note the generator will fail if run in an empty workspace with no applications. To create a new Next application please run the NX Next generator with the following command including any relevant options. See  [@nrwl/next plugin docs](https://nx.dev/packages/next)

```
nx g @nrwl/next:app my-new-app
```

## How to Get Started

Install the `@ensono-stacks/next` with the following command:

### NPM
npm  install --save-dev @ensono-stacks/next@latest

### Yarn
yarn  add  --dev @ensono-stacks/next@latest
 
## Generators and Executors

To see a list of the plugin capabilities run the following command:

```
nx list @ensono-stacks/next
```

View additional information about a plugin capability through the following command:

```
nx g @ensono-stacks/next:[generator-executor-name] --help
```

### @ensono-stacks/next:init

The next init generator will add a custom ESlint config to an existing NextJs application, install  `eslint-plugin-testing-library`  to the project. as well as update project.json with a custom test config to allow coverage collection from  [jest](https://jestjs.io/).

If infrastructure already exists for the workspace, this plugin will also call  `@ensono-stacks/next:infrastructure`  to add build & deploy infrastructure to the Next project.

####  Prerequisites

An existing [Next](https://nextjs.org/) application

####  Usage

```bash
nx g @ensono-stacks/next:init
```

####  Command line arguments

The following command line arguments are available:

| Option | Description | Type | Accepted Values |Default |
| --- | ------------------- | --- | --- | --- |
| --project | Name of the existing next application | string | nameOfApplication | N/A |
| --infra | Add build & deploy infrastructure to the Next project | boolean | true/false | true |

###  Generator Output

The following files will be updated if no workspace infrastructure information is present, or if the `--infra` flag is set to false

```text
UPDATE apps/baseline-next-app/project.json #Updated with custom test config to allow for coverage collection
UPDATE apps/baseline-next-app/.eslintrc.json #Ehanced with additional linting rules
UPDATE apps/baseline-next-app/tsconfig.json #Minor enhancements
UPDATE apps/baseline-next-app/tsconfig.spec.json #Updates for monorepo structure
UPDATE apps/baseline-next-app/specs/index.spec.tsx #Formatting changes
```
Otherwise, the `@ensono-stacks/next:infrastructure` will have also added build & deploy infrastructure to the Next project.

### @ensono-stacks/next:next-auth

The next-auth generator will install and configure [NextAuth.js](https://next-auth.js.org/) into an existing Next application. It will add the initial configuration, add the session provider, setup an API endpoint and add local environmental variables. It will also configure provider specific setup.

#### Command line arguments

The following command line arguments are available:

| Option | Description | Type | Accepted Values |Default |
| --- | ------------------- | --- | --- | --- |
| --project | The name of the project | nameOfApplication | string | N/A |
| --provider | The provider to be installed | string | none/azureAd |none |
| --skipPackageJson | Do not add dependencies to `package.json` | boolean | true/false |false |

####  Generator Output

- Creates a new Next API endpoint with the file name `[...nextauth].ts`. This contains the dynamic route handler for NextAuth.js which will also contain all of your global NextAuth.js configurations. If you have specified a provider when running the generator this will be added to the providers array

```typescript 
import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
const nextAuth = NextAuth({
	providers: [
		AzureADProvider({
			clientId: process.env.AZURE_AD_CLIENT_ID,
			clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
			tenantId: process.env.AZURE_AD_TENANT_ID,
		}),
	],
});

export default nextAuth;

```

- Install the next-auth package and add to package.json, unless the `--skipPackageJson` option was used

```json
"dependencies": {
...otherDependencies
"next-auth": "4.18.8",
},
```

- Create or append an `.env.local` file. Adding required next auth environmental variables. These will vary depending on the provider chosen.

```typescript

NEXTAUTH_URL=http://localhost:4200
NEXTAUTH_SECRET=secretValue
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=
```
Be sure to update the environmental variables with the values provided by your provider.

- Append the `_app.tsx` file with a [session provider](https://next-auth.js.org/getting-started/client#sessionprovider)

```typescript
import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';
import { SessionProvider } from 'next-auth/react';

function CustomApp({
	Component,
	pageProps: { session, ...pageProps },
}: AppProps) {

return (
<SessionProvider session={session}>
	<Head>
		<title>Welcome to testing!</title>
	</Head>

	<main className="app">
		<Component {...pageProps} />
	</main>
</SessionProvider>
);
}

export default CustomApp;
```

From here with the configuration complete it is now possible to access the [useSession](https://next-auth.js.org/getting-started/client#usesession) hook from next auth. For further information please see the [Getting Started Guide to Next Auth](https://next-auth.js.org/getting-started/example#frontend---add-react-hook)

### @ensono-stacks/next:next-auth-redis

The next-auth-redis generator will add Redis for session management into your existing Next app with Next-auth.

#### Prerequisites

An existing [Next](https://nextjs.org/) application with Next-auth. Use the `@ensono-stacks/next:next-auth` generator to add this into your application

####  Command line arguments

The following command line arguments are available:

| Option | Description | Type | Accepted Values |Default |
| --- | ------------------- | --- | --- | --- |
| --project | The name of the project | string | string | N/A |
| --adapterName | Name of the generated Redis adapter library | string | | next-auth-redis |
| --envVar | Name of the env var that stores connection string for Redis | string | | REDIS_URL |

####  Generator Output

A new redis library will be added to your `libs` folder with the following structure:

```bash
libs
│ next-auth-redis
│ ├── src
│ │ ├── index.ts #All code required for session management with Redis
│ │ ├── index.test.ts #Unit tests using 'ioredis-mock' to mock Redis functions.
│ ├── README.md
│ ├── tsconfig.json
│ ├── tsconfig.lib.json
│ ├── project.json
│ ├── .eslintrc.json
│ ├── jest.config.ts
└── └── tsconfig.spec.json
```

In order for Redis to be used within next-auth a new entry for the redis library is added to the tsconfig.base.json "paths"

```json
"paths": {
	"@<workspace-name>/next-auth-redis": [
		"libs/next-auth-redis/src/index.ts"
	]
}
```

Your `[...nextauth].ts` file within the Next application will be updated to use the new Redis adapter:

```typescript
import { Redis } from 'ioredis';
import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { IORedisAdapter } from '@0-5-23-next-with-test-app/next-auth-redis';

const nextAuth = NextAuth({
	providers: [
		AzureADProvider({
		clientId: process.env.AZURE_AD_CLIENT_ID,
		clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
		tenantId: process.env.AZURE_AD_TENANT_ID,
		}),
	],
	adapter: IORedisAdapter(new Redis(process.env.REDIS_URL)),
});

export default nextAuth;

```

#####  Build and Deployment updates

When infrastructure is detected for the application, these files will be enhanced to cater for Redis:

- "app-name"/build/values[-prod].yaml files will have 3 new entries added for redis
```yaml
redisURL: ''
nextAuthSecret: ''
nextAuthURL: <app-name>.<internal/external domain>
```

- "app-name"/terraform/main.tf will have a new azurerm_redis_cache resource added. The variables.tf file will have these corresponding variables defined

```typescript
resource "azurerm_redis_cache" "default_primary" {
name = var.redis_name
location = var.redis_resource_group_location
resource_group_name = var.redis_resource_group_name
capacity = var.redis_capacity
family = var.redis_family
sku_name = var.redis_sku_name
minimum_tls_version = var.minimum_tls_version
}
```

- "app-name"/terraform/[prod/nonprod].tfvars will have additional variables added.

```typescript
redis_name = "<company>-<domain>-<prod/nonprod>-<cloud region>-<business component>"
redis_resource_group_location = "%REPLACE%"
redis_resource_group_name = "<company>-<domain>-<prod/nonprod>-<cloud region>-<business component>"
```
Be sure to update the redis_resource_group_location value

- "app-name"/terraform/outputs.tf will have the redis_connection_string added

```typescript
output "redis_connection_string" {
	sensitive = true
	value = "rediss://:${azurerm_redis_cache.default_primary.primary_access_key}@${azurerm_redis_cache.default_primary.hostname}:${azurerm_redis_cache.default_primary.ssl_port}"
}
```

- "app-name"/.env.local will have the REDIS_URL env variable added and set

```typescript
REDIS_URL=localhost:6379
```

- "app-name"/project.json will have the helm-upgrade commands updated to use the NEXTAUTH_SECRET

```typescript
"helm-upgrade": {
"executor": "nx:run-commands",
"options": {
"commands": [
	{
		"command": "helm upgrade [... unchanged ...] --set nextAuthSecret=\\\"$NEXTAUTH_SECRET\\\"",
		"forwardAllArgs": false
	}
],
"cwd": "apps/baseline-next-app/build/terraform"
},

"configurations": {
"prod": {
	"commands": [
			{
				"command": "helm upgrade [... unchanged ...] --set nextAuthSecret=\\\"$NEXTAUTH_SECRET\\\"",
				"forwardAllArgs": false
			}
		]
	}
}
```
For Azure DevOps, the **NEXTAUTH_SECRET** needs to be added to the <company\>-<component\>-<domain\>-nonprod and <company\>-<component\>-<domain\>-prod' variable groups

### @ensono-stacks/next:infrastructure
The infrastructure generator will provide all the necessary tools and setup ready to host your application in a Kubernetes Cluster. You can also choose to opt in to OpenTelemetry auto instrumentation.

####  Prerequisites

An existing [Next](https://nextjs.org/) application. This may already exist if you agreed to install the infra during next:init generator.

####  Usage

```bash
nx g @ensono-stacks/next:infrastructure
```
####  Command line arguments

The following command line arguments are available:

| Option | Description | Type | Accepted Values | Default |
| --------------- | -------------------------------------- | ----------------- | --------------- | ------- |
| --project | The name of the project | nameOfApplication | string | N/A |
| --openTelemetry | Add OpenTelemetry auto instrumentation | boolean | true/false | false |

####  Generator Output

```text
├── workspace root
├── apps
├── myapp
├── build
├── helm
├── terraform
```

- Creates numerous files under the two folders, helm and terraform. You can then go in and update relevant parts for your use case.

- Adds following files to .gitignore

```text
'**/.terraform/*',
'*.tfstate',
'*.tfstate.*',
'crash.log',
'crash.*.log',
'override.tf',
'override.tf.json',
'*_override.tf',
'*_override.tf.json',
'.terraformrc',
'terraform.rc',
```

- installs following dev dependencies

```text
@nx-tools/nx-container
@nx-tools/container-metadata
@jscutlery/semver
```

- It is a requirement for the `stacks` object to exist inside `nx.json`, as this is read to know how to scaffold the infrastructure as code values. This object will already be populated by this point via the previous project scaffolding steps.

```json
"stacks": {
	"business": {
	"company": "Amido",
	"domain": "stacks",
	"component": "nx"
	},
	"domain": {
	"internal": "test.com",
	"external": "test.dev"
	},
	"cloud": {
	"platform": "azure",
	"region": "euw"
	},
	"pipeline": "azdo",
	"terraform": {
	"group": "terraform-group",
	"storage": "terraform-storage",
	"container": "terraform-container"
	},
	"vcs": {
	"type": "github",
	"url": "remote.git"
	}
}
```
####  Understanding the Infrastructure

Azure devops configuration exists within the build folder for each new generated app project. This folder lives at root.

####  build/azDevOps

`azuredevops-runner.yaml`

Here you will find the actions for triggering the pipelines. Basically, creating a PR will build as a non prod artefact and merging into main branch will build as a prod artefact, with the relevant parameter specified.

`azuredevops-stages.yaml`

This is of course the actual stages of the pipeline that are configured. Most of the detail is done via taskctl, which can found as the last task in the build job.

###  taskctl

[taskctl](https://github.com/taskctl/taskctl) has been used to enable across different environments and builds. Cross platform, one single syntax.

As a rule of thumb, each task here references a target execution via Nx defined inside project.json. The flag --target is used to pass in the appropriate value.

`build/taskctl/tasks.yaml`

```yaml
helm:
description: Lint Helm Charts
command:
	- npx nx affected --base="$BASE_SHA" --target=helm-lint
```

`apps/myapp/project.json`

```yaml
"helm-lint": {
	"executor": "nx:run-commands",
	"options": {
		"commands": [
			{
			"command": "helm lint",
			"forwardAllArgs": false
			}
		],
		"cwd": "apps/myapp/build/helm"
	}
}

```

Hence, running the following will trigger the intended execution. The pipeline takes care of this for us.

```bash
npx nx affected --base="$BASE_SHA" --target=helm-lint
```

Following on from this, we can see various steps such as linting, building, running helm, versioning and terraform are subsequently executed.

###  Helm

The configuration files for Helm Charts live inside the build folder under directory for your app, within the project

`myproject/apps/myapp/build/helm`

In the infra pipeline, the steps for Helm will begin by linting, followed by either an upgrade or install. If the Helm chart is already installed, then an upgrade occurs based on the given command. If it isn't installed, then an installation occurs instead. The command accepts a `--atomic` flag which will allow Helm to roll back to the previous release should a failure during upgrade occur. On install, this would cause the installation to fail if there were any issues.

The remaining tasks are then carried out post versioning, covered in the next section.

###  Versioning

[jscutlery:semver](https://github.com/jscutlery/semver) is an Nx plugin which has been configured to automate semantic versioning and release in these projects. It follow conventional commits and is also applied to proceeding pipeline targets such as Helm charts.

###  Package & Push

After versioning, our build is containerised using Docker and pushed to the set Azure registry.

Likewise, the Helm Charts are also packaged and pushed to their respective place in the Azure registry.

Finally a Github release is tagged with relevant notes using jscutlery.

###  Terraform

This is the last group of tasks to run as part of the infrastructure. See `myproject/apps/myapp/build/terraform` for configuration files.

One thing to highlight is that once the Terraform apply task is completed, a Helm install will also be executed. As mentioned earlier, the default behaviour is to deploy a non-production instance when a PR is created and once the PR is merged, then the deployment is made to production.

###  OpenTelemetry

OpenTelemetry is a collection of tools, APIs, and SDKs. Use it to instrument, generate, collect, and export telemetry data (metrics, logs, and traces) to help you analyse your software’s performance and behaviour.

If the generator is used with the openTelemetry option it will add auto instrumentation to the pods, and the application will start exporting default node metrics and traces.

```yaml
podAnnotations:
	instrumentation.opentelemetry.io/inject-nodejs: 'true'
```

OpenTelemetry logs are in an experimental phase, this means there is no node support at the moment, and there is no known ETA either.

## Full documentation

Please visit the stacks documentation page for `next`

[here](https://stacks.amido.com/docs/nx/next/ensono-stacks-next) for more information
