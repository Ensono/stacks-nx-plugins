
# Azure Node

This library is a NX plugin. Please see further documentation on NX plugins

[here](https://nx.dev/plugin-features/create-your-own-plugin)

  

## What is its purpose?

Configures your NodeJS application to use various Azure services:

-   [App Insights](https://www.npmjs.com/package/applicationinsights)
-   ...more to come.

## How to Get Started

Install the `@ensono-stacks/azure-node` with the following command:

### NPM
```
npm  install --save-dev @ensono-stacks/azure-node@latest
```

### Yarn
```
yarn  add  --dev @ensono-stacks/azure-node@latest
```

## Generators and Executors

  

View a list of the plugin executors/generators through the following command:

  ```
nx list @ensono-stacks/azure-node
```

View additional information about a plugin capability through the following command:

```
nx g @ensono-stacks/azure-node:[generator-executor-name] --help
```
### @ensono-stacks/azure-node:app-insights

This generator will add and configure [applicationinsights](https://www.npmjs.com/package/applicationinsights) npm package for you.

####  Prerequisites

- Requires a NodeJs server for application insights to hook into.

Use the [@nrwl/next:custom-server](https://nx.dev/packages/next/generators/custom-server) generator which will have been added to your workspace by [@ensono-stacks/workspace`](https://stacks.amido.com/docs/nx/workspace/ensono-stacks-workspace) to generate your NodeJS server!


- It requires the APPLICATIONINSIGHTS_CONNECTION_STRING environment variable to be set.

There is a known issue with the [`@nrwl/next:custom-server`](https://nx.dev/packages/next/generators/custom-server) impacting _customServerTarget_ when typescript libraries are present in the monorepo. Please check the following [Github Issue](https://github.com/nrwl/nx/issues/12032) for the status of this issue.

####  Usage

```bash
nx generate @ensono-stacks/azure-node:app-insights
```

####  Command line arguments

The following command line arguments are available:

| Option | Description | Type |
| --- | --------------------------------------------------------- | --- |
| --project | Target project name. | string |
| --appInsightsKey | The env variable that stores the app insights key. | string |
| --server | Path to custom server file inside the project. | string |

####  Generator Output

- Adds `applicationinsights` dependency in `package.json`.

- Extends `main()` function in the server file to initialise and configure app insights.

## Full documentation

Please visit the stacks documentation page for `azure-node`

[here](https://stacks.amido.com/docs/nx/azure-node/ensono-stacks-azure-node) for more information