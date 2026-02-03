import {
    addStacksAttributes,
    checkFilesExistInTree,
} from '@ensono-stacks/test';
import { Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/next';
import { storybookConfigurationGenerator } from '@nx/react';
import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

import generator from './generator';
import { StorybookGeneratorSchema } from './schema';

jest.mock('@ensono-stacks/core', () => ({
    ...jest.requireActual('@ensono-stacks/core'),
    execAsync: jest.fn(),
    getCommandVersion: jest.fn(() => '1.0.0'),
}));

jest.mock('@nx/react', () => ({
    storybookConfigurationGenerator: jest.fn(),
}));

describe('storybook generator', () => {
    let appTree: Tree;

    const options: StorybookGeneratorSchema = {
        project: 'next-app',
    };

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        await applicationGenerator(appTree, {
            name: 'next-app',
            style: 'css',
            directory: 'next-app',
        });

        addStacksAttributes(appTree, options.project);
        (storybookConfigurationGenerator as jest.Mock).mockResolvedValue(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await generator(appTree, { ...options });
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('Storybook'),
            ).toBe(true);
        });

        it('eslint config with react query plugin', async () => {
            const eslintConfig = readJson(appTree, 'next-app/.eslintrc.json');

            expect(eslintConfig.extends).toContain(
                'plugin:storybook/recommended',
            );
        });

        it('return false from method and exit generator if already executed', async () => {
            const gen = await generator(appTree, {
                ...options,
            });

            expect(gen).toBe(false);
        });

        it('should install storybook dependencies', async () => {
            await generator(appTree, options);

            const packageJson = readJson(appTree, 'package.json');

            expect(Object.keys(packageJson.devDependencies)).toEqual(
                expect.arrayContaining([
                    '@nx/storybook',
                    '@storybook/nextjs',
                    '@storybook/addon-links',
                    '@storybook/manager-api',
                    '@storybook/preview-api',
                    '@storybook/addon-a11y',
                    '@storybook/addon-actions',
                    '@storybook/addon-jest',
                    '@storybook/theming',
                ]),
            );
        });

        it('should generate storybook folder with main file', async () => {
            await generator(appTree, options);

            expect(() =>
                checkFilesExistInTree(appTree, `next-app/.storybook/main.ts`),
            ).not.toThrow();
        });

        it('should generate storybook folder with preview config', async () => {
            await generator(appTree, options);

            expect(() =>
                checkFilesExistInTree(
                    appTree,
                    `next-app/.storybook/preview.ts`,
                ),
            ).not.toThrow();
        });

        it('should generate storybook tsconfig file', async () => {
            await generator(appTree, options);

            expect(() =>
                checkFilesExistInTree(
                    appTree,
                    `next-app/tsconfig.storybook.json`,
                ),
            ).not.toThrow();
        });
    });

    it('should skip installing dependencies', async () => {
        await generator(appTree, { ...options, skipPackageJson: true });

        const packageJson = readJson(appTree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).not.toEqual(
            expect.arrayContaining(['storybook']),
        );
    });
});
