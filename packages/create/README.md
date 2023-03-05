
# Workspace

This library is a NX plugin. Please see further documentation on NX plugins

[here](https://nx.dev/plugin-features/create-your-own-plugin)

### What is its purpose?

Create a new Stacks Nx workspace. Using the create-stacks-workspace script will quickly allow you to initialize a new NX workspace with the Stacks recommended plugins, packages and configuration to get started on a new project quickly.

## How to Get Started

You can scaffold a brand new Stacks and Nx workspace through the @ensono-stacks/create-stacks-workspace plugin.

Follow the interactive questions with the below command to get started:

```bash

npx @ensono-stacks/create-stacks-workspace@latest

```

Visit the @ensono-stacks/create-stacks-workspace [docs](https://stacks.amido.com/docs/nx/create-stacks-workspace/ensono-stacks-create-stacks-workspace) for more information and setup instructions!

## Generators and Executors

View a list of the plugin executors/generators through the following command:

```bash
nx list @ensono-stacks/workspace
```

### Presets
On running the script you will be asked for a monorepo preset with the following options

```bash
apps [an empty monorepo with no plugins with a layout that works best for building apps]
react [a monorepo with a single React application]
next.js [a monorepo with a single Next.js application]
```

Each preset will install, configure and run any recommended plugins for that specific preset. For example the next.js preset will run the [NX NextJS](https://nx.dev/packages/next) plugin application generator as well as the [Ensonso stacks NextJS](/docs/nx/next/ensono-stacks-next) init plugin generator.

**You will then be asked which test runner to include for e2e testing:**

1. none: Creates your application without an e2e test project

2. playwright: Installs the [@ensono-stacks/playwright](https://stacks.amido.com/docs/nx/playwright/ensono-stacks-playwright) plugin and creates an e2e test project for your application using playwright.

### Command line arguments

The following command line arguments are available:

| Option | Description | Type | Example Accepted Values | Default |
| -- | -- | -- | -- | -- |
| --name | Workspace name (e.g. org name) | string | nameOfWorkspace | |
| --preset | Customizes the initial content of your workspace | string | apps/ts/next/react-monorepo | |
| --dir | The directory to install to | string | /path/to/dir | ./ |
| --appName | The name of the application when a preset with pre-generated app is selected | string | nameOfApplication | |
| --e2eTestRunner | Test runner to use in generating an e2e test project | string | ["none", "playwright"] | none |
| --nxVersion | Set the version of Nx you want installed | string | |latest |
| --packageManager | Package manager to use | string | pnpm/npm/yarn | npm |
| --interactive | Enable interactive mode | boolean | true/false | true |
| --overwrite | Overwrite the target directory on install | boolean | true/false | false |
| --cloud.platform | Name of the cloud provider | string | azure | azure |
| --cloud.region | Region name where resources should be created | string | string | euw |
| --pipeline | Name of the pipeline provider | string | azdo | azdo |
| --business.company | Company Name | string | string | |
| --business.domain | Company Scope or area | string | string | |
| --business.component | Company component being worked on | string | string | |
| --domain.internal | Internal domain for nonprod resources | string | string | |
| --domain.external | External domain for prod resources | string | string | |
| --terraform.group | Terraform state group name | string | string | |
| --terraform.container | Terraform storage container name | string | string | |
| --terraform.storage | Terraform storage name | string | string | |
| --vcs.type | Version control provider | string | azdo/github | |
| --vcs.url | Version control remote url | string | string | |

  
## Full documentation
Please visit the stacks documentation page for `create-stacks-workspace`

[here](https://stacks.amido.com/docs/nx/create-stacks-workspace/ensono-stacks-create-stacks-workspace) for more information