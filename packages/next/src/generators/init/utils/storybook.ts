import { execAsync, normalizeOptions } from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    generateFiles,
    readProjectConfiguration,
    // runTasksInSerial,
    Tree,
} from '@nx/devkit';
import { runTasksInSerial } from '@nx/workspace/src/utilities/run-tasks-in-serial';
import chalk from 'chalk';
import { execSync, spawnSync } from 'child_process';
import path from 'path';

import {
    ADDON_A11Y_STORYBOOK_VERSION,
    ADDON_ACTIONS_STORYBOOK_VERSION,
    ADDON_JEST_STORYBOOK_VERSION,
    ADDON_LINKS_STORYBOOK_VERSION,
    MANAGER_API_STORYBOOK_VERSION,
    NEXTJS_STORYBOOK_VERSION,
    NX_STORYBOOK_VERSION,
    PREVIEW_API_STORYBOOK_VERSION,
    THEMING_STORYBOOK_VERSION,
} from './constants';
import { NextGeneratorSchema } from '../schema';

function addStorybookDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            '@nx/storybook': NX_STORYBOOK_VERSION,
            '@storybook/nextjs': NEXTJS_STORYBOOK_VERSION,
            '@storybook/addon-links': ADDON_LINKS_STORYBOOK_VERSION,
            '@storybook/manager-api': MANAGER_API_STORYBOOK_VERSION,
            '@storybook/preview-api': PREVIEW_API_STORYBOOK_VERSION,
            '@storybook/addon-a11y': ADDON_A11Y_STORYBOOK_VERSION,
            '@storybook/addon-actions': ADDON_ACTIONS_STORYBOOK_VERSION,
            '@storybook/addon-jest': ADDON_JEST_STORYBOOK_VERSION,
            '@storybook/theming': THEMING_STORYBOOK_VERSION,
        },
    );
}

export function addStorybook(tree: Tree, options: NextGeneratorSchema) {
    const normalizedOptions = normalizeOptions(tree, {
        ...options,
        name: options.project,
        directory: tree.root,
    });

    const project = readProjectConfiguration(tree, normalizedOptions.name);

    try {
        addStorybookDependencies(tree);

        execAsync(
            `npx nx g @nx/react:storybook-configuration --name=${project.name} --configureCypress=false --generateCypressSpecs=false --no-interactive --verbose`,
            project.root,
        );

        generateFiles(tree, path.join(__dirname, `../files`), project.root, {});

        return () => {};
    } catch (error) {
        console.log(error);

        console.error(
            chalk.red`Failed to install NX React Storybook configuration`,
        );

        return () => {};
    }
}
