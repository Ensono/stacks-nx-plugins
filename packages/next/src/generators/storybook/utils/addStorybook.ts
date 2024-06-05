import { execAsync } from '@ensono-stacks/core';
import { GeneratorCallback, ProjectConfiguration, Tree } from '@nx/devkit';
import chalk from 'chalk';

export function addStorybook(
    tree: Tree,
    project: ProjectConfiguration,
): GeneratorCallback {
    return async () => {
        try {
            await execAsync(
                `npx nx generate @nx/react:storybook-configuration --project=${project.name} --no-interactive`,
                project.root,
            );
        } catch (error) {
            console.log(error);

            console.error(
                chalk.red`Failed to install NX React Storybook configuration`,
            );
        }
    };
}
