
# Workspace

This library is a NX plugin. Please see further documentation on NX plugins

[here](https://nx.dev/plugin-features/create-your-own-plugin)

 ### What is its purpose?
 
The @ensono-stacks/workspace plugin contains generators to manage the Nx workspace itself. These will often be useful in any workspace, regardless of the specific apps or libraries it contains.

Using a standard setup for workspaces ensures consistency across projects and allows developers to easily onboard onto new projects.

## Installation

Install the `@ensono-stacks/workspace` with the following command:

 ### NPM
 
```bash
npm install --save-dev @ensono-stacks/workspace@latest
```
### Yarn

```bash
yarn add --dev @ensono-stacks/workspace@latest
```

`@ensono-stacks/workspace` depends on the `@ensono-stacks/core` plugin.

## Generators and Executors

View a list of the plugin executors/generators through the following command:

```bash
nx list @ensono-stacks/workspace
```

View additional information about a plugin capability through the following command:
```bash
nx g @ensono-stacks/workspace:[generator-executor-name] --help
```

### Init
Initialise your NX workspace with stacks with the following command:
```bash
nx g @ensono-stacks/workspace:init
```
####  Command line arguments

Interactive options can instead be passed via the command line:

| Option | Description | Type | Accepted Values | Default |
|------------------|--------------------------------|---------|-----------------|---------|
| --husky | Install & configure husky | boolean | [true, false] | true |
| --commitizen | Install & configure commitizen | boolean | [true, false] | true |
| --eslint | Install & configure eslint | boolean | [true, false] | true |
| --pipelineRunner | Which pipeline runner to use | enum | [taskctl, none] | taskctl |

###  Generator Output

Files updated: package.json

Files created:

```cs

├── workspace root
│ ├── .husky
│ ├── ├── commit-msg
│ ├── ├── pre-commit
│ ├── ├── prepare-commit-msg
│ ├── .eslintrc.json
│ ├── commitlint.config.js
│ ├── tsconfig.base.json

```
If `--pipelineRunner=taskctl` is passed, the generator will also create a `build` directory:
```cs
├── workspace root
│ ├── build
│ ├── ├── azDevOps
│ ├── ├── ├── azuredevops-runner.yaml - Azure Devops pipeline definition. Consumes `stages` and `vars` files in this directory
│ ├── ├── ├── azuredevops-stages.yaml - Azure Devops pipeline stages
│ ├── ├── ├── azuredevops-vars.yaml - Azure Devops variable definitions required by the pipeline
│ ├── ├── taskctl
│ ├── ├── ├── contexts.yaml - Context definitions for taskctl
│ ├── ├── ├── tasks.yaml - Task definitions for taskctl to be consumed by the pipeline
```

This sets up a CI/CD pipeline to provide a smooth collaborative workflow.

Currently supported pipeline tools are [Azure Devops](https://azure.microsoft.com/en-gb/products/devops/) and [taskctl](https://github.com/taskctl/taskctl).

**Warning:**
The `build` files will only be generated if required project values have been collected from the [Stacks CLI](https://stacks.amido.com/docs/stackscli/about) or through the [@ensono-stacks/create-stacks-workspace](https://stacks.amido.com/docs/nx/workspace/ensono-stacks-workspace) plugin.


## Full documentation

Please visit the stacks documentation page for `workspace`

[here](https://stacks.amido.com/docs/nx/workspace/ensono-stacks-workspace) for more information
