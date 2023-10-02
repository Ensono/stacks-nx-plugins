import {
    execAsync,
    getResourceGroup,
    normalizeOptions,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    generateFiles,
    GeneratorCallback,
    readJson,
    readProjectConfiguration,
    readRootPackageJson,
    runTasksInSerial,
    Tree,
} from '@nx/devkit';
import chalk from 'chalk';
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
    });

    const project = readProjectConfiguration(
        tree,
        normalizedOptions.projectName,
    );

    try {
        addStorybookDependencies(tree);

        // TODO: fix npm command issue
        // execAsync(
        //     `npx nx g @nx/react:storybook-configuration ${options.project} --configureCypress=false --generateCypressSpecs=false --no-interactive`,
        //     project.root,
        // );

        generateFiles(tree, path.join(__dirname, `../files`), project.root, {});

        return () => {};
    } catch {
        console.error(
            chalk.red`Failed to install NX React Storybook configuration`,
        );

        return () => {};
    }

    // return runTasksInSerial(
    //     addStorybookDependencies(tree),
    //     () =>
    //         execAsync(
    //             `nx g @nx/react:storybook-configuration ${options.project} --no-interactive`,
    //             project.root,
    //         ) as Promise<void>,
    //     () =>
    //         generateFiles(
    //             tree,
    //             path.join(__dirname, `../files`),
    //             project.root,
    //             {},
    //         ),
    // );
}
