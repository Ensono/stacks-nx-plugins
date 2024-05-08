import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/next';

import generator from './generator';
import { NextAuthGeneratorSchema } from './schema';
import {
    nextAppWithDestructuredProperties,
    nextAppWithProviders,
    nextAuthEmpty,
    nextAuthWithGithub,
} from './test/fixtures';

describe('next-auth generator', () => {
    let appTree: Tree;
    const optionsWithAzureAdProvider: NextAuthGeneratorSchema = {
        project: 'next-app',
        provider: 'azureAd',
    };

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        await applicationGenerator(appTree, {
            name: 'next-app',
            style: 'css',
        });

        addStacksAttributes(appTree, optionsWithAzureAdProvider.project);
    });

    it('should install NextAuth without a provider', async () => {
        await generator(appTree, {
            ...optionsWithAzureAdProvider,
            provider: 'none',
        });

        const packageJson = readJson(appTree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['next-auth']),
        );

        expect(appTree.exists('next-app/.env.local')).toBeTruthy();
        expect(
            appTree.exists('next-app/src/app/api/hello/route.ts'),
        ).toBeTruthy();

        const appTs = appTree.read('next-app/src/app/layout.tsx');

        expect(appTs.toString()).toMatchSnapshot();
    });

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await generator(appTree, {
                ...optionsWithAzureAdProvider,
                provider: 'none',
            });
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    optionsWithAzureAdProvider.project
                ].includes('NextAuth'),
            ).toBe(true);
        });

        it('should return false from method and exit generator if already executed', async () => {
            const gen = await generator(appTree, {
                ...optionsWithAzureAdProvider,
                provider: 'none',
            });

            expect(gen).toBe(false);
        });
    });

    it('should configure app if there are already wrapping react providers', async () => {
        appTree.write('next-app/src/app/layout.tsx', nextAppWithProviders);
        await generator(appTree, optionsWithAzureAdProvider);

        const AppTsx = appTree.read('next-app/src/app/layout.tsx');

        expect(AppTsx.toString()).toMatchSnapshot();
    });

    it('should configure app if pageProps is already destructured', async () => {
        appTree.write(
            'next-app/src/app/layout.tsx',
            nextAppWithDestructuredProperties,
        );
        await generator(appTree, optionsWithAzureAdProvider);

        const AppTsx = appTree.read('next-app/src/app/layout.tsx');

        expect(AppTsx.toString()).toMatchSnapshot();
    });

    it('should install NextAuth with a provider', async () => {
        await generator(appTree, optionsWithAzureAdProvider);

        const nextAuthTs = appTree.read('next-app/auth.ts');

        expect(nextAuthTs.toString()).toMatchSnapshot();
    });

    it('should error if an existing NextAuth install is not valid', async () => {
        appTree.write('next-app/auth.ts', `const hello = 'hello'`);
        await expect(
            generator(appTree, optionsWithAzureAdProvider),
        ).rejects.toThrowError(
            'Unable to find the NextAuth implementation function.',
        );
    });
    it('should safely run on an existing NextAuth install', async () => {
        await generator(appTree, optionsWithAzureAdProvider);

        const nextAuthTs = appTree.read('next-app/auth.ts');

        expect(nextAuthTs.toString()).toMatchSnapshot();
    });

    it('should run on an existing NextAuth install with no providers', async () => {
        appTree.write('next-app/auth.ts', nextAuthEmpty);
        await generator(appTree, {
            project: 'next-app',
            provider: 'none',
        });

        const nextAuthTs = appTree.read('next-app/auth.ts');

        expect(nextAuthTs.toString()).toMatchSnapshot();
    });

    it('should appendto an existing list of providers', async () => {
        appTree.write('next-app/auth.ts', nextAuthWithGithub);
        await generator(appTree, optionsWithAzureAdProvider);

        const nextAuthTs = appTree.read('next-app/auth.ts');

        expect(nextAuthTs.toString()).toMatchSnapshot();
    });

    it('should append to an existing .env.local', async () => {
        appTree.write('next-app/.env.local', 'NEXTAUTH_URL=http://website.com');
        await generator(appTree, optionsWithAzureAdProvider);
        const localEnv = appTree.read('next-app/.env.local');
        expect(localEnv.toString()).toContain(
            'NEXTAUTH_URL=http://website.com',
        );
        expect(localEnv.toString()).not.toContain(
            'NEXTAUTH_URL=http://localhost:4200',
        );
    });

    it('should skip installing depndencies', async () => {
        await generator(appTree, {
            ...optionsWithAzureAdProvider,
            skipPackageJson: true,
        });

        const packageJson = readJson(appTree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).not.toEqual(
            expect.arrayContaining(['next-auth']),
        );
    });
});
