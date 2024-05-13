import { execAsync } from '@ensono-stacks/core';
import { ProjectConfiguration, Tree } from '@nx/devkit';
import chalk from 'chalk';

export async function addStorybook(tree: Tree, project: ProjectConfiguration) {
    try {
        await execAsync(
            `npx nx g @nx/react:storybook-configuration --project=${project.name} --interactionTests=false --no-interactive --verbose`,
            project.root,
        );

        return () => {};
    } catch (error) {
        console.log(error);

        console.error(
            chalk.red`Failed to install NX React Storybook configuration`,
        );

        return () => {};
    }
}
