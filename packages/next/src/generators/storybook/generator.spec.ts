import {
    addStacksAttributes,
    checkFilesExistInTree,
} from '@ensono-stacks/test';
import { Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/next';
import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

import generator from './generator';
import { StorybookGeneratorSchema } from './schema';
import { addCustomCommand } from './utils/addCustomCommand';

jest.mock('@ensono-stacks/core', () => ({
    ...jest.requireActual('@ensono-stacks/core'),
    execAsync: jest.fn(),
    getCommandVersion: jest.fn(() => '1.0.0'),
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
        });

        addStacksAttributes(appTree, options.project);
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
                checkFilesExistInTree(appTree, `next-app/.storybook/main.js`),
            ).not.toThrow();
        });

        it('should generate storybook folder with preview config', async () => {
            await generator(appTree, options);

            expect(() =>
                checkFilesExistInTree(
                    appTree,
                    `next-app/.storybook/preview.js`,
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

    it('should add custom component command', async () => {
        const projectConfig: ProjectConfiguration = {
            root: 'next-app',
            name: 'next-app',
        };

        addCustomCommand(appTree, projectConfig);
        const projectJson = readJson(appTree, 'next-app/project.json');

        const expectedJson = {
            executor: 'nx:run-commands',
            options: {
                commands: [
                    'nx g @nx/react:component --name={args.name} --project=next-app --directory={args.folderPath}',
                    'nx g @nx/react:component-story --project=next-app --componentPath={args.folderPath}/{args.name}/{args.name}.tsx',
                ],
                parallel: false,
            },
        };
        expect(projectJson.targets['custom-component']).toBeTruthy();
        expect(projectJson.targets['custom-component']).toEqual(expectedJson);
    });
});
