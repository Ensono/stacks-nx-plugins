
# Stacks Project Guidelines

- [Introduction](#introduction)
- [Get Started](#get-started)
  - [System Requirements](#system-requirements)
  - [Setup](#setup)
- [Naming Conventions and Coding Style](#naming-conventions-and-coding-style)
- [Creating a New Plugin](#creating-a-new-plugin)
  - [Generator Analysis](#generator-analysis)
  - [Development process](#development-process)
- [Testing](#testing)
  - [Unit Testing](#unit-testing)
  - [End to end testing](#end-to-end-testing)
  - [Testing packages locally](#testing-packages-locally)
- [Contributing Changes](#contributing-changes)
- [Releasing packages and publishing to NPM](#releasing-packages-and-publishing-to-npm)

## Introduction

Welcome to the Stacks project! This document provides guidelines to help you get started with the Stacks workspace and develop new plugins or contribute to existing ones. It covers setup instructions, development practices, testing, and contribution guidelines.

## Get Started

### System Requirements

To set up the Stacks workspace, ensure that you have the following installed on your system:

- npm

- Node.js version 18 or above

The following are recommended plugins for visual studio code:

- [Nx Console](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console)

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

- [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)

- [Jest Runner](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner)

### Setup

To start working in the `stacks-nx-plugins` run the following command:

```bash

npm run prepare

```

This will set up [Husky](https://typicode.github.io/husky/) to manage commit quality which enforces naming and documentation conventions upon commits through [commitizen](https://commitizen-tools.github.io/commitizen/).

## Naming Conventions and Coding Style

When working with the Stacks project, adhere to the following naming conventions and coding style guidelines:

- Ensure husky has been configured to enforce commit standards

- Branch naming conventions:

  - `feat/name` for features

  - `fix/name` for bug fixes

  - `docs/name` for documentation-related changes

## Creating a New Plugin

If you want to create a new plugin within the Stacks project, follow these steps:

### Generator Analysis

When creating a new plugin you should first understand your goals and the desired end state of what your plugin and accompanying generators should create for the user.

It is then recommended to break this down into multiple generators where applicable:

- @ensono-stacks/*plugin*:init (init should be responsible for generating the core requirements of your desired end state)

- @ensono-stacks/*plugin*:init-deployment (init-deployment should be responsible for making all relevant changes to deployment files to ensure that your generated code can be deployed. NOTE: Only if required)

- @ensono-stacks/*plugin*:[additional] (Any additional configuration or code which may not always be required, but adds some additional useful functionality or behaviour to the users project should be split into their own generator. Alternatively, if the additional behaviour is only small, you could also consider adding this as a optional part of the init schema).

***Cypress Example:***

**@ensono-stacks/cypress:init** - Add a cypress testing framework to an application and configures everything surrounding the test execution and reporting

**@ensono-stacks/cypress:init-deployment** - Adds e2e tests as a stage within pipeline execution and reporting to azure

**@ensono-stacks/cypress:accessibility** - Adds accessibility tests and it's dependencies/configuration to the application/project

### Development process

From a process perspective, it is recommended to develop your desired end state first, which can then be reverse engineered back into a plugin/generators. Here is an example of the process followed for creating our `@ensono-stacks/cypress` plugin:

***Step 1: Creating your end state***

- Create a baseline workspace with a Next.js application. Commit this to your `main` branch

- Create a new branch, e.g. `cypress-baseline` for the *init* generator. In this branch, install and configure the Cypress testing framework with the required configurations.

- Create a new branch from `cypress-baseline` for the *init-deployment* generator (`cypress-deployment`), adding the additional requirements for deploying your application with cypress tests.

- Create a new branch from `cypress-baseline` for the *accessibility* generator (`cypress-accessibility`), adding the additional requirements for adding accessibility tests using cypress to your application.

***Step 2: Create your plugin, generators and unit tests.***

TDD should be followed. For each generator to create you should write all of the unit tests to verify that the files you create or amend match the desired states defined in step 1.
Following the approach outlined in step 1, tailored to your own plugin, helps to determine the behaviour and responsibility of each required generator. Through the git comparison functionality you gain a visual representation of exactly what has changed and in which files, making development of your unit tests MUCH easier!

- Create a new plugin with the following command:

```bash

nx g @nx/plugin:plugin <plugin name> --importPath @ensono-stacks/<plugin name>

```

For each new generator, the following command can be run:

```bash

nx generate @nx/plugin:generator <generator name> --project=<plugin name>

```

- *init* generator: Use Git to review the differences between the `cypress-baseline` branch and the `main` branch. This will help identify the files your generator needs to manipulate or create, then write all of the unit tests to check that the desired end state is met.

- *init-deployment* generator: Use Git to review the differences between the `cypress-deployment` branch and the `cypress-baseline` branch. This will help identify files which need to be amended/created on top of the *init* files and create your unit tests.

- *accessibility* generator: Use Git to review the differences between the `cypress-accessibility` branch and the `cypress-baseline` branch. Again creating the relevant unit tests.

***Step 3: Implementation***

It is worth reviewing existing plugins to understand how we utilise the `@nx/devkit` and `@ensono-stacks/core` to create and manipulate files.

Some important initial checks:

1. `verifyPluginCanBeInstalled()`: Checks to see if the workspace is compatible

2. `hasGeneratorExecutedForProject()`: If the generator can only be ran once, this ensures that the `nx.json` and stacks `executedGenerators` list is correctly updated.

Once the code has been written for your generators, you must create corresponding e2e tests to ensure that your plugin can be built, published and executed within a stacks/nx workspace.

## Testing

### Unit Testing

Unit tests should looks to cover all areas of a generator in regards to file creation and manipulation. By following a TDD approach this should ensure maximum coverage for all of the files which are affected by a generator.

- You can use the Jest runner plugin in Visual Studio Code or Nx to run the tests with the following commands:

  - Test a specific package

  ```bash
  nx test <package-name>
  ```

  - Test all packages that have been updated

  ```bash
  nx affected -t test
  ```

  - Run the test target for multiple packages

  ```bash
  nx run-many -t test -p proj1 proj2
  ```

  - Run the test target for all packages

  ```bash
  nx run-many --target test --all --parallel 8
  ```

### End to end testing

End to end tests look to cover usage of the plugin within an Nx workspace, in order verify this we have built a custom [e2e executor](./packages/common/e2e/src/executors/e2e/executor.ts) to run our tests using [verdaccio](https://verdaccio.org/) as a private proxy registry.

The following are the steps in which e2e tests follow:

1. The e2e executor builds, packages and deploys the selected plugin and it's dependent packages, including the create and workspace packages, to the verdaccio instance.
2. The [newProject(stacksPackageToInstall, nxPackagesToInstall)](./packages/common/e2e/src/utils/project.ts) method will then create a new Stacks workspace using the `@ensono-stacks/create-stacks-workspace` plugin which has been published to verdaccio. It will then install the plugin you are testing in the workspace.
3. With the workspace provisioned, e2e tests should look to verify that the various generators available to the plugin can be executed and utilised within the workspace.

To run your e2e tests you must use the e2e executor:

```bash
nx e2e <plugin name>-e2e
```

### Testing packages locally

- Option 1: Use npm linking
  - TO BE COMPLETED - @Metecan
- Option 2: Use npm packing
  - You can build and package your plugin locally through `npm pack`

  ```bash
  nx run-many -t build -p package1 package2
  cd dist/packages/<package>
  npm pack
  ```

  - From your workspace used for testing you can then directly reference the pack file from your `package.json` and install it with `npm install`

## Contributing Changes

To contribute your changes back to the Stacks project, follow these steps:

1. Raise a pull request on GitHub to the main branch.

2. Complete the pull request template with all the relevant information requested.

3. Ensure that the following status checks are met before merging the branch:

- All unit and e2e tests pass for the affected packages.

- Code has been reviewed and approved.

## Releasing packages and publishing to NPM

Stacks uses [semantic versioning](https://semver.org/) with the [@jscutlery/semver](https://github.com/jscutlery/semver) plugin to handle package versioning, alongside [commitizen](https://commitizen-tools.github.io/commitizen/) to determine what version to bump a plugin to.

There are two workflows in place for deployment:

- **prerelease**: Publishes an alpha version of the plugin to the `@dev` tag
  - When a package is merged to `main` the [prerelease.yml](/.github/workflows/prerelease.yml) workflow is ran, this calls the `version` target for all projects which have been updated using the `prerelease` configuration. Example version: `plugin-2.0.0-alpha-100.0`.
- **release**: Publishes the next version of the plugin to the `@latest` tag
  - The [release.yml](/.github/workflows/release.yml) workflow can be ran manually to publish the next version of **all** plugins. Once a prerelease package has been verified and you are happy, then the release workflow can be ran.
