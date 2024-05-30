# Ensono Stacks with Nx

> See [the contributing guide](./CONTRIBUTING.md) for detailed instructions on
> how to get started with contributing to the stacks project.

## Using Stacks

The ideologies of Stacks and [`Nx`](https://nx.dev/) are aligned in their focus
on providing businesses with a framework that accelerates development, allowing
you to focus on business objectives with best practice code. Leveraging Nx
allows us to build upon that work and to fill the gaps with infrastructure,
pipelines and the integration with other Stacks subsystems. Leveraging Nx allows
a common developer experience, global communities of support, and an enterprise
ready base.

<!-- markdownlint-disable MD033 -->
<details>
  <summary>What is Nx?</summary>
    <p>The Nx framework is a powerful tool that allows developers to easily build, test, and automate their applications. It is built on top of the popular open-source Node.js platform, and provides a streamlined and efficient workflow for building apps. With Nx, developers can easily manage their dependencies, automate tasks, and quickly test their applications.</p>
    <p>Additionally, Nx provides powerful features such as code-sharing, optimized builds, and real-time feedback, making it an ideal choice for any developer looking to streamline their development process and improve their productivity.</p>
    <p>Find out more about Nx through their official [documentation](https://nx.dev/getting-started/intro)!</p>
</details>

For the reasons listed above we have chosen to use Nx within Stacks for CSR and
SSR frontend web applications, capitalising on Nx generators and executors to
streamline your development and testing processes.

<details>
  <summary>What are Nx Generators and Executors?</summary>
    <p>Nx generators and executors are two powerful features of the Nx build system that allow developers to quickly and easily generate new code and files for their projects, as well as to automate common tasks.</p>
    <p>Nx generators are templates that can be used to quickly generate new code and files for different types of projects, such as Angular applications, React components, and Node.js services. Developers can use these generators to quickly create the code and files they need, based on pre-defined templates, saving them time and effort.</p>
    <p>Nx executors, on the other hand, are scripts that can be used to automate common tasks, such as building, testing, and deploying code. Developers can use these executors to automate repetitive tasks and to streamline their workflow. Executors can also be customized to suit the specific needs of a project, making them a highly versatile tool.</p>
</details>

## Set up your stacks workspace

Visit the official Stacks documentation site for Nx
[here](https://stacks.ensono.com/docs/nx/nx_stacks)!

## Stacks Plugins

To accelerate your project development and ensure consistency across those
projects, we have several stacks plugins available!

| Plugin                                                                                                                                                   | Description                                                                                                                                                                                                                                                                                                                                                                    |
| :------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@ensono-stacks/create-stacks-workspace`](https://stacks.ensono.com/docs/getting_started/create-stacks-workspace/ensono-stacks-create-stacks-workspace) | Create an Nx workspace using stacks!<li>Create an Nx workspace for a Next application with your choice of testing framework!</li><li>Create a testing project for the generated Next application. Supported: Playwright & Cypress</li>                                                                                                                                         |
| [`@ensono-stacks/workspace`](https://stacks.ensono.com/docs/getting_started/workspace/ensono-stacks-workspace)                                           | 'Stackify' your existing Nx workspace<li>Add build and deploy infrastructure to your workspace</li><li>Set up libraries to manage code & commit quality</li>                                                                                                                                                                                                                   |
| [`@ensono-stacks/next`](https://stacks.ensono.com/docs/getting_started/next/ensono-stacks-next)                                                          | Enhance your Next.js project with Stacks!<li>Add stacks configuration and developer tools to an existing next application</li><li>Add NextAuth.js to your next application</li><li>Add build and deploy infrastructure to your next application</li>                                                                                                                           |
| [`@ensono-stacks/azure-node`](https://stacks.ensono.com/docs/getting_started/azure-node/ensono-stacks-azure-node)                                        | <li>Add Azure app insights to a node project in your stacks workspace</li>                                                                                                                                                                                                                                                                                                     |
| [`@ensono-stacks/rest-client`](https://stacks.ensono.com/docs/getting_started/rest-client/ensono-stacks-rest-client)                                     | Add a rest client to a project in your stacks workspace<li>Create an Axios http-client with custom configuration</li><li>Create a client endpoint with Axios HTTP methods for your application</li><li>Bump existing endpoints to new versions</li><li>Create code implementation from an OpenApi schema using Orval</li>                                                      |
| [`@ensono-stacks/playwright`](https://stacks.ensono.com/docs/getting_started/playwright/ensono-stacks-playwright)                                        | Add the playwright testing library and much more to your project!<li>Create a playwright testing project for your application</li><li>Add accessibility testing to your test project</li><li>Add native visual testing with playwright</li><li>Add visual testing with Applitools eyes</li><li>Add playwright testing and reporting automatically to your build pipelines</li> |
| [`@ensono-stacks/cypress`](https://stacks.ensono.com/docs/getting_started/cypress/ensono-stacks-cypress)                                                 | Add the cypress testing library and much more to your project!<li>Add accessibility testing to your test project</li><li>Add cypress testing and reporting automatically to your build pipelines</li>                                                                                                                                                                          |
| [`@ensono-stacks/logger`](https://stacks.ensono.com/docs/getting_started/logger/ensono-stacks-logger)                                                    | Add industry standard logging capabilities to your project<li>Add Winston to your project</li>                                                                                                                                                                                                                                                                                 |
