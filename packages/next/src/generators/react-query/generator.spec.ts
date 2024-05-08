import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/next';

import generator from './generator';
import { ReactQueryGeneratorSchema } from './schema';
import { nextAppWithProviders } from './test/fixtures';

describe('react-query generator', () => {
    let appTree: Tree;
    const options: ReactQueryGeneratorSchema = {
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

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await generator(appTree, { ...options });
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('ReactQuery'),
            ).toBe(true);
        });

        it('eslint config with react query plugin', async () => {
            const eslintConfig = readJson(appTree, 'next-app/.eslintrc.json');

            expect(eslintConfig.extends).toContain(
                'plugin:@tanstack/eslint-plugin-query/recommended',
            );
        });

        it('return false from method and exit generator if already executed', async () => {
            const gen = await generator(appTree, {
                ...options,
            });

            expect(gen).toBe(false);
        });
    });

    it('should configure app if there are already wrapping react providers', async () => {
        appTree.write('next-app/src/app/layout.tsx', nextAppWithProviders);
        await generator(appTree, options);

        const AppTsx = appTree.read('next-app/src/app/layout.tsx');

        expect(AppTsx.toString()).toMatchSnapshot();
    });

    it('should have providers content provided', async () => {
        await generator(appTree, options);

        const AppTsx = appTree.read('next-app/src/app/providers.tsx');

        expect(AppTsx.toString()).toMatchSnapshot();
    });

    it('should skip installing dependencies', async () => {
        await generator(appTree, { ...options, skipPackageJson: true });

        const packageJson = readJson(appTree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).not.toEqual(
            expect.arrayContaining(['react-query']),
        );
    });
});
