
# Playwright

  

This library is a NX plugin. Please see further documentation on NX plugins

[here](https://nx.dev/plugin-features/create-your-own-plugin)

  

### What is its purpose?

Using the @ensono-stacks/playwright plugin can help you get started with testing using playwright, with it's comprehensive feature set this plugin helps you capitalise on those features by accelerating your setup process and providing examples to get you started.

Additionally, if infrastructure has been generated through the @ensono-stacks/next:infrastructure then Playwright E2E tests will be added to your pipelines!

## How to Get Started

Install the `@ensono-stacks/playwright` plugin with the following command:

### NPM
```
npm  install --save-dev @ensono-stacks/playwright@latest
```

### Yarn
```
yarn  add  --dev @ensono-stacks/playwright@latest
```

## Generators and Executors

To see a list of the plugin capabilities run the following command:
```
nx list @ensono-stacks/playwright
```
View additional information about a plugin capability through the following command:
```
nx g @ensono-stacks/playwright:[generator-executor-name]  --help
```

### @ensono-stacks/playwright:init
The _init_ generator creates a playwright project for the application you choose. Additionally it initialises your playwright project with additional stacks configuration and adds playwright tests to your pipeline if present.

####  Usage
```bash
nx g @ensono-stacks/playwright:init
```
Upon calling the _init_ generator you will be presented with the following question:
- What app would you like to generate a test project for?
- The name of the existing application to generate a test project for (named <app-name\>-e2e)

####  Command line arguments

The following command line arguments are available:

| Option | Description | Type |
| --------------- | -------------------------------------------------------------- | --- |
| --project | The name of the application to generate a test project for | string |

#### Default output

The _init_ generator will create a new test project for your chosen application containing an example test and predefined configuration for the monorepo and the individual test projects.

By default the _init_ generator will configure both a baseline playwright configuration and an individual project base playwright configuration.

```text
.
├── apps
│ ├── <app-name>-e2e
│ │ ├── src
│ │ │ ├── example.spec.ts #Example tests using playwright
│ │ ├── playwright.config.ts #Example playwright configuration catering for multiple browsers and devices
│ │ ├── project.json #Configuration for the project, including various NX targets
│ │ ├── tsconfig.e2e.json #E2E typscript config file
│ │ ├── tsconfig.json #typscript config file
│ │ ├── .eslintrc.json #Linting configuration for the e2e project
└── playwright.config.base.ts
```
Visit the [`Testing with Playwright`](https://stacks.amido.com/docs/nx/playwright/ensono-stacks-playwright) documentation for further details!

### @ensono-stacks/playwright:accessibility

The _accessibility_ generator installs [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md) and configures an example accessibility test.

####  Usage

```bash
nx g @ensono-stacks/playwright:accessibility
```

####  Command line arguments

The following command line arguments are available:

| Option | Description | Type |
| --------------- | -------------------------------------------------------------- | --- |
| --project -p | The name of the test project to add accessibility tests to | string |

####  Generator Output

Scaffolding accessibility testing will add two dependencies to the `package.json`:

1. [`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/README.md) - The accessibility test engine

2. [`axe-result-pretty-print`](https://www.npmjs.com/package/axe-result-pretty-print) - Result formatter

Additionally, an example accessibility test will be generated, showcasing how to utilise both _axe_ and _axe-result-pretty-print_ to scan your application for accessibility violations:

```text
.
├── apps
│ ├── <app-name>-e2e
│ │ ├── src
│ │ │ ├── axe-accessibility.spec.ts #Example accessibility test using playwright
└──────────
```

### @ensono-stacks/playwright:visualRegression

The _visualRegression_ generator provides you with the option to scaffold visual regression tests and configuration through a cloud based provider or Playwrights native visual comparison API.

####  Usage

```bash
nx g @ensono-stacks/playwright:visualRegression
```
Upon calling the _visualRegression_ generator you will be presented with a number of options:
- What type of visual regression tests would you like to use?
- native: Generate visual regression tests using Playwrights native [visual comparison api](https://playwright.dev/docs/test-snapshots)
- applitools: Generate visual regression tests using the [`@applitools/eyes-playwright`](https://www.npmjs.com/package/@applitools/eyes-playwright) plugin and scaffold an example visual regression test batch

####  Command line arguments

The following command line arguments are available:

| Option | Description | Type | Accepted Values |Default |
| --------------- | -------------------------------------------------------------- | --- | --- | --- |
| --project | The name of the existing playwright test app to enhance | string | | |
| --visualRegression, -v | Method used to conduct visual testing | string | [choices: "native", "applitools"] | none |

####  Playwright with native visual comparisons

Opting to scaffold **native** visual testing will make a number of amendments to your test projects configuration:

1. [playwright.config.ts snapshot configuration](../../testing/testing_in_nx/playwright_visual_testing#snapshot-configuration): Configuration for your visual tests
2. [playwright-visual-regression.spec.ts](../../testing/testing_in_nx/playwright_visual_testing#sample-tests): Sample test showcasing how to perform visual testing using playwrights native [visual comparison api](https://playwright.dev/docs/test-snapshots).
3. project.json: Additional task set up to enable you to run your visual regression tests using the playwright:jammy container

```text
.
├── apps
│ ├── <app-name>-e2e
│ │ ├── src
│ │ │ ├── playwright-visual-regression.spec.ts #Example visual test using playwright
├── build
│ ├── azDevOps
│ │ ├── azuredevops-updatesnapshots.yaml #Pipeline to capture and update baseline images within the CI
└──────────
```

####  Playwright with Applitools Eyes

Opting to scaffold visual testing with **applitools** will make a number of amendments to your test projects configuration:

1. [@applitools/eyes-playwright](https://www.npmjs.com/package/@applitools/eyes-playwright): Dependency added to `package.json`
2. [playwright.config.ts project configuration](../../testing/testing_in_nx/playwright_visual_testing_applitools.md#applitools-eyes-with-playwright): Standalone project configuration to isolate visual tests with Applitools Eyes
3. [applitools-eyes-grid.spec.ts](../../testing/testing_in_nx/playwright_visual_testing_applitools.md#sample-tests): Sample test showcasing how to perform visual testing using the Applitools Eyes Grid.

```text
.
├── apps
│ ├── <app-name>-e2e
│ │ ├── src
│ │ │ ├── applitools-eyes-grid.spec.ts #Example visual test using playwright
└──────────
```

###  @mands/nx-playwright:playwright-executor
The _playwright-executor_ executor is a third party executor provided by @mands and enables you to run your e2e tests.

####  Usage

The following command will run all of the playwright tests within your e2e test folder, as part of the executor it will automatically spin up a web server on local host for the corresponding application.

```bash
nx e2e <app-name>-e2e
```
####  Command line arguments

See the [@mands/nx-playwright](https://github.com/marksandspencer/nx-plugins/tree/main/packages/nx-playwright#execution-flags) plugin page for a list of up to date command line arguments

## Full documentation

Please visit the stacks documentation page for `playwright`

[here](https://stacks.amido.com/docs/nx/playwright/ensono-stacks-playwright) for more information
