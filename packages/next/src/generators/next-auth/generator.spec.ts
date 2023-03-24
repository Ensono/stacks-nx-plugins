import { testInitStacksConfig } from '@ensono-stacks/core';
import { Tree, readJson, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';

import generator from './generator';
import { NextAuthGeneratorSchema } from './schema';
import {
    nextAppWithProviders,
    nextAppWithDestructuredProperties,
    nextAuthEmpty,
    nextAuthWithGithub,
} from './test/fixtures';

describe('next-auth generator', () => {
    let appTree: Tree;
    const options: NextAuthGeneratorSchema = {
        project: 'next-app',
        provider: 'azureAd',
    };

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        await applicationGenerator(appTree, {
            name: 'next-app',
            style: 'css',
        });

        testInitStacksConfig(appTree, options.project);
    });

    it('should install NextAuth without a provider', async () => {
        await generator(appTree, { ...options, provider: 'none' });

        const packageJson = readJson(appTree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['next-auth']),
        );

        expect(appTree.exists('next-app/.env.local')).toBeTruthy();
        expect(
            appTree.exists('next-app/pages/api/auth/[...nextauth].ts'),
        ).toBeTruthy();

        const appTs = appTree.read('next-app/pages/_app.tsx');

        expect(appTs.toString()).toMatchSnapshot();
    });

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await generator(appTree, { ...options, provider: 'none' });
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('NextAuth'),
            ).toBe(true);
        });

        it('should return false from method and exit generator if already executed', async () => {
            const gen = await generator(appTree, {
                ...options,
                provider: 'none',
            });

            expect(gen).toBe(false);
        });
    });

    it('should configure app if there are already wrapping react providers', async () => {
        appTree.write('next-app/pages/_app.tsx', nextAppWithProviders);
        await generator(appTree, options);

        const AppTsx = appTree.read('next-app/pages/_app.tsx');

        expect(AppTsx.toString()).toMatchSnapshot();
    });

    it('should configure app if pageProps is already destructured', async () => {
        appTree.write(
            'next-app/pages/_app.tsx',
            nextAppWithDestructuredProperties,
        );
        await generator(appTree, options);

        const AppTsx = appTree.read('next-app/pages/_app.tsx');

        expect(AppTsx.toString()).toMatchSnapshot();
    });

    it('should install NextAuth with a provider', async () => {
        await generator(appTree, options);

        const nextAuthTs = appTree.read(
            'next-app/pages/api/auth/[...nextauth].ts',
        );

        expect(nextAuthTs.toString()).toMatchSnapshot();
    });

    it('should safely run on an existing NextAuth install', async () => {
        await generator(appTree, options);
        await generator(appTree, options);

        const nextAuthTs = appTree.read(
            'next-app/pages/api/auth/[...nextauth].ts',
        );

        expect(nextAuthTs.toString()).toMatchSnapshot();
    });

    it('should error if an existing NextAuth install is not valid', async () => {
        appTree.write('next-app/pages/api/auth/[...nextauth].ts', '');
        await expect(generator(appTree, options)).rejects.toThrowError(
            'Unable to find the NextAuth implementation function.',
        );
    });

    it('should run on an existing NextAuth install with no providers', async () => {
        appTree.write(
            'next-app/pages/api/auth/[...nextauth].ts',
            nextAuthEmpty,
        );
        await generator(appTree, options);

        const nextAuthTs = appTree.read(
            'next-app/pages/api/auth/[...nextauth].ts',
        );

        expect(nextAuthTs.toString()).toMatchSnapshot();
    });

    it('should appendto an existing list of providers', async () => {
        appTree.write(
            'next-app/pages/api/auth/[...nextauth].ts',
            nextAuthWithGithub,
        );
        await generator(appTree, options);

        const nextAuthTs = appTree.read(
            'next-app/pages/api/auth/[...nextauth].ts',
        );

        expect(nextAuthTs.toString()).toMatchSnapshot();
    });

    it('should append to an existing .env.local', async () => {
        appTree.write('next-app/.env.local', 'NEXTAUTH_URL=http://website.com');
        await generator(appTree, options);
        const localEnv = appTree.read('next-app/.env.local');
        expect(localEnv.toString()).toContain(
            'NEXTAUTH_URL=http://website.com',
        );
        expect(localEnv.toString()).not.toContain(
            'NEXTAUTH_URL=http://localhost:4200',
        );
    });

    it('should skip installing depndencies', async () => {
        await generator(appTree, { ...options, skipPackageJson: true });

        const packageJson = readJson(appTree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).not.toEqual(
            expect.arrayContaining(['next-auth']),
        );
    });
});
