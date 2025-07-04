# Stacks Project Guidelines

-   [Stacks Project Guidelines](#stacks-project-guidelines)
    -   [Introduction](#introduction)
    -   [Get Started](#get-started)
        -   [System Requirements](#system-requirements)
        -   [Setup](#setup)
    -   [Naming Conventions and Coding Style](#naming-conventions-and-coding-style)
    -   [Creating a New Plugin](#creating-a-new-plugin)
        -   [Generator Analysis](#generator-analysis)
        -   [Development process](#development-process)
    -   [Testing](#testing)
        -   [Unit Testing](#unit-testing)
        -   [End to end testing](#end-to-end-testing)
        -   [Testing packages locally](#testing-packages-locally)
        -   [Testing stacks workspace locally](#testing-stacks-workspace-locally)
        -   [Create stacks workspace script](#create-stacks-workspace-script)
    -   [Contributing Changes](#contributing-changes)
    -   [Releasing packages and publishing to NPM](#releasing-packages-and-publishing-to-npm)

## Introduction

Welcome to the Stacks project! This document provides guidelines to help you get
started with the Stacks workspace and develop new plugins or contribute to
existing ones. It covers setup instructions, development practices, testing, and
contribution guidelines.

## Get Started

### System Requirements

To set up the Stacks workspace, ensure that you have the following installed on
your system:

-   [pnpm](https://pnpm.io/installation)

-   [Node.js](https://nodejs.org/en) version 22.16.0 LTS (Minimum/Recommended)

The following are recommended plugins for visual studio code:

-   [Nx Console](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console)

-   [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

-   [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

-   [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)

-   [Jest Runner](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner)

### Setup

To start working in the `stacks-nx-plugins` run the following command:

```bash

pnpm run prepare

```

This will set up [Husky](https://typicode.github.io/husky/) to manage commit
quality which enforces naming and documentation conventions upon commits through
[commitizen](https://commitizen-tools.github.io/commitizen/).

### Nx Cloud Integration

Speak with the Team to get read-only access to Nx Cloud. Nx Cloud provides
remote caching of task executions to speed up tasks in development.

## Naming Conventions and Coding Style

When working with the Stacks project, adhere to the following naming conventions
and coding style guidelines:

-   We adhere to the
    [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
    standard, a lightweight convention on top of commit messages. Commitizen has
    been added as a hook to Husky, which will provide a CLI to help complete
    commits which adhere to the below:

    -   Commit messages should be structured as follows

        ```text
        <type>[optional scope]: <description>

        [optional body]

        [optional footer(s)]

        ```

    -   _type_: defined by
        [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional)
    -   _scope_: Provide additional context to the impact of the change.

        ```text
        ** Example **
        feat(core): Replace old function

        BREAKING CHANGE: removes function used across multiple files
        ```

-   Branch naming conventions:

    -   `feat/name` for features

    -   `fix/name` for bug fixes

    -   `docs/name` for documentation-related changes

## Creating a New Plugin

If you want to create a new plugin within the Stacks project, follow these
steps:

### Generator Analysis

When creating a new plugin you should first understand your goals and the
desired end state of what your plugin and accompanying generators should create
for the user.

It is then recommended to break this down into multiple generators where
applicable:

-   @ensono-stacks/_plugin_:init (init should be responsible for generating the
    core requirements of your desired end state)

-   @ensono-stacks/_plugin_:init-deployment (init-deployment should be
    responsible for making all relevant changes to deployment files to ensure
    that your generated code can be deployed. NOTE: Only if required)

-   @ensono-stacks/_plugin_:[additional] (Any additional configuration or code
    which may not always be required, but adds some additional useful
    functionality or behaviour to the users project should be split into their
    own generator. Alternatively, if the additional behaviour is only small, you
    could also consider adding this as a optional part of the init schema).

**_Next Example:_**

**@ensono-stacks/next:init** - Configure a Next Application for Stacks

**@ensono-stacks/next:next-auth** - Adds Authentication to an existing Next
Application

### Development process

From a process perspective, it is recommended to develop your desired end state
first, which can then be reverse engineered back into a plugin/generators. Here
is an example of the process followed for creating our `@ensono-stacks/next`
plugin:

**_Step 1: Creating your end state_**

-   Create a baseline workspace with a Next.js application. Commit this to your
    `main` branch

-   Create a new branch, e.g. `next-baseline` for the _init_ generator. In this
    branch, install and configure the Next.js application with the required
    configurations.

-   Create a new branch from `next-next-auth` for the _next-auth_ generator
    (`next-next-auth`), adding the additional requirements for adding
    authentication to a Next.js application application.

**_Step 2: Create your plugin, generators and unit tests._**

TDD should be followed. For each generator to create you should write all of the
unit tests to verify that the files you create or amend match the desired states
defined in step 1. Following the approach outlined in step 1, tailored to your
own plugin, helps to determine the behaviour and responsibility of each required
generator. Through the git comparison functionality you gain a visual
representation of exactly what has changed and in which files, making
development of your unit tests MUCH easier!

-   Create a new plugin with the following command:

    ```bash
    nx g @nx/plugin:plugin <plugin name> --importPath @ensono-stacks/<plugin name>
    ```

For each new generator, the following command can be run:

```bash
nx generate @nx/plugin:generator <generator name> --project=<plugin name>
```

-   _init_ generator: Use Git to review the differences between the
    `next-baseline` branch and the `main` branch. This will help identify the
    files your generator needs to manipulate or create, then write all of the
    unit tests to check that the desired end state is met.

-   _next-auth_ generator: Use Git to review the differences between the
    `next-next-auth` branch and the `next-baseline` branch. Again creating the
    relevant unit tests.

**_Step 3: Implementation_**

It is worth reviewing existing plugins to understand how we utilise the
`@nx/devkit` and `@ensono-stacks/core` to create and manipulate files.

The following two functions come from the `@ensono-stacks/core` package and must
be the first calls inside any generator for validation purposes:

1. `verifyPluginCanBeInstalled()`: Checks to see if the workspace is compatible

2. `hasGeneratorExecutedForProject()`: If the generator can only be ran once,
   this ensures that the `nx.json` and stacks `executedGenerators` list is
   correctly updated. If the executor has ran before and this method
   `returns true`, you should `return false` from the generator. If this
   generator can be ran multiple times, then this check can be omitted.

Once the code has been written for your generators, you must create
corresponding e2e tests to ensure that your plugin can be built, published and
executed within a stacks/nx workspace.

## Testing

### Unit Testing

Unit tests should look to cover all areas of a generator in regards to file
creation and manipulation. By following a TDD approach this should ensure
maximum coverage for all of the files which are affected by a generator.

-   You can use the Jest runner plugin in Visual Studio Code or Nx to run the
    tests with the following commands:

    -   Test a specific package

        ```bash
        nx test <package-name>
        ```

    -   Test all packages that have been updated

        ```bash
        nx affected -t test
        ```

    -   Run the test target for multiple packages

        ```bash
        nx run-many -t test -p proj1 proj2
        ```

    -   Run the test target for all packages

        ```bash
        nx run-many --target test --all --parallel 8
        ```

### End to end testing

End to end tests look to cover usage of the plugin within an Nx workspace, in
order verify this we have built a custom
[e2e executor](./packages/common/e2e/src/executors/e2e/executor.ts) to run our
tests using [verdaccio](https://verdaccio.org/) as a private proxy registry.

The following are the steps in which e2e tests follow:

1. The e2e executor builds, packages and deploys the selected plugin and it's
   dependent packages, including the create and workspace packages, to the
   verdaccio instance.
2. To ensure that packages are built from the codebase the `project.json` file
   inside the e2e plugin folder (eg e2e/create-e2e/project.json) needs to have
   its `implicitDependencies` updated. It needs to contain each of the plugins
   that will be used in the test. Otherwise the latest published version of the
   plugin will be used.
3. The
   [newProject(stacksPackagesToInstall, nxPackagesToInstall)](./packages/common/e2e/src/utils/project.ts)
   method will then create a new Stacks workspace using the
   `@ensono-stacks/create-stacks-workspace` plugin which has been published to
   verdaccio. It will then install the plugin you are testing in the workspace.
4. With the workspace provisioned, e2e tests should look to verify that the
   various generators available to the plugin can be executed and utilised
   within the workspace.

To run your e2e tests you must use the e2e executor:

```bash
nx e2e <plugin name>-e2e
```

### Testing packages locally

In most cases you should leverage the E2E test framework to test packages
locally, as it automatically handles building and publishing to a local
registry. However if you want to test this outside of the repo we have a few
processes you can use.

-   **Option 1**: [pnpm linking](https://pnpm.io/cli/link)

    -   Step 1: Build the plugin which you would like to use/test locally:

        ```bash
        nx build <pluginName>
        ```

    -   Step 2: Link the built plugin through `npx link`:

        ```bash
        pnpm link dist/packages/<pluginName>
        ```

    -   Step 3: Link to the built package from the workspace where you want to
        test:

        ```bash
        pnpm link ../../stacks-nx-plugins/dist/packages/<pluginName>
        ```

    -   From the workspace where you want to test your plugin you should now see
        the symlink present within your node_modules. As the link has taken
        place, for further changes simply running a new build as in step 1
        should be enough, without having to go through steps 2 & 3 again. If
        not, repeat the steps.

-   **Option 2**: pnpm packing

    -   You can build and package your plugin locally through `pnpm pack`

        ```bash
        nx run-many -t build -p package1 package2
        cd dist/packages/<package>
        pnpm pack
        ```

    -   From your workspace used for testing you can then directly reference the
        pack file from your `package.json` and install it with `npm install`

### Testing stacks workspace locally

Follow these steps to run the stacks workspace locally.

-   Step 1: Run Local Registry Script

    ```bash
    pnpm run local-registry
    ```

    You should now be able to visit http://localhost:4873/ to see the registry.

-   Step 3: Run workspace locally

    -   If minimatch throws an error - remove node_modules folder and
        package.json-lock file then npm install
    -   To run workspace local with latest changes - run this command outside of
        the stacks-nx-plugin repository:

    ```bash
    pnpx @ensono-stacks/create-stacks-workspace@e2e --stacksVersion=e2e
    ```

### Create stacks workspace script

The
[@ensono-stacks/create-stacks-workspace](https://stacks.ensono.com/docs/getting_started/create-stacks-workspace/ensono-stacks-create-stacks-workspace)
is the entry point for creating a stacks workspace from scratch, please review
the official stacks documentation for it's usage and command line arguments.

When working with pre-releases (See
[releasing packages](#releasing-packages-and-publishing-to-npm)) you must pass
in an additional argument to the create script to ensure that it uses the
specific pre-released plugin versions:

```bash
npx @ensono-stacks/create-stacks-workspace@dev --stacksVersion=0.0.1-alpha
```

## Contributing Changes

To contribute your changes back to the Stacks project, follow these steps:

1. Raise a pull request on GitHub to the main branch.

2. Complete the pull request template with all the relevant information
   requested.

3. Ensure that the following status checks are met before merging the branch:

-   All unit and e2e tests pass for the affected packages.

-   Code has been reviewed and approved.

## Releasing packages and publishing to NPM

Stacks uses [commitizen](https://commitizen-tools.github.io/commitizen/) to
create conventional commits. Changes are scoped to individual packages so we can
highlight changes individually.
[Nx release](https://nx.dev/features/manage-releases) is used to version and
publish packages which uses the commit history to determine
[semantic versioning](https://semver.org/).

Stacks uses a single semantic version for all packages (similar to Nx's
versioning strategy). Stacks use's Nx release's programmatic API defined in
`scripts/version.ts`.

There are two workflows in place for deployment:

-   **prerelease**: Creates an alpha release of all packages to the `@dev` tag
    -   When a package is merged to `main` the
        [prerelease.yml](/.github/workflows/prerelease.yml) workflow is run,
        this calls `pnpm release --specifier=prerelease`. A Prerelease Github
        Realease is created.
-   **release**: Creates a production release of all the packages to the
    `@latest` tag
    -   The [release.yml](/.github/workflows/release.yml) workflow must be run
        manually to publish the next version of **all** packages. Once a
        prerelease package has been verified and you are happy, then the release
        workflow can be run. A Production Github Realease is created.
-   **publish**: Publishes all packages to npm
    -   When a Github Release is created (prerelease/production) the publish
        workflow is run [publish.yml](/.github/workflows/publish.yml). This will
        publish all packages to npm.
