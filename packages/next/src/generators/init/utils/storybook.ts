import {
    execAsync,
    getResourceGroup,
    normalizeOptions,
} from '@ensono-stacks/core';
import {
    generateFiles,
    GeneratorCallback,
    readProjectConfiguration,
    runTasksInSerial,
    Tree,
} from '@nx/devkit';
import path from 'path';

import { NextGeneratorSchema } from '../schema';

export function addStorybook(tree: Tree, options: NextGeneratorSchema) {
    const normalizedOptions = normalizeOptions(tree, {
        ...options,
        name: options.project,
    });
    const project = readProjectConfiguration(
        tree,
        normalizedOptions.projectName,
    );

    const callbackTasks: GeneratorCallback[] = [];

    callbackTasks.push(
        () =>
            execAsync(
                'npm install -D @nx/storybook',
                project.root,
            ) as Promise<void>,
        () =>
            execAsync(
                'npm install -D @storybook/nextjs @storybook/addon-links @storybook/manager-api @storybook/preview-api @storybook/addon-a11y @storybook/addon-actions @storybook/addon-jest @storybook/theming',
                project.root,
            ) as Promise<void>,
        () =>
            execAsync(
                'nx g @nx/react:storybook-configuration ui',
                project.root,
            ) as Promise<void>,
    );

    generateFiles(
        tree,
        path.join(__dirname, `../files/.storybook`),
        project.root,
        {},
    );

    return runTasksInSerial(...callbackTasks);
}
