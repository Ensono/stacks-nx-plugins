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
            standaloneConfig: false,
        });

        updateJson(appTree, 'nx.json', nxJson => ({
            ...nxJson,
            stacks: {
                business: {
                    company: 'Amido',
                    domain: 'stacks',
                    component: 'nx',
                },
                domain: {
                    internal: 'test.com',
                    external: 'test.dev',
                },
                cloud: {
                    region: 'euw',
                    platform: 'azure',
                },
                pipeline: 'azdo',
                terraform: {
                    group: 'terraform-group',
                    storage: 'terraform-storage',
                    container: 'terraform-container',
                },
                vcs: {
                    type: 'github',
                    url: 'remote.git',
                },
            },
        }));
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

    it('should generate redis adapter lib', async () => {
        await generator(appTree, {
            ...options,
            redisAdapter: true,
            redisEnvVar: 'REDIS_URL',
        });

        const nextAuthTs = appTree.read(
            'next-app/pages/api/auth/[...nextauth].ts',
        );
        expect(nextAuthTs.toString()).toMatchSnapshot();

        expect(appTree.exists('next-auth-redis/src/index.ts')).toBeTruthy();

        const localEnv = appTree.read('next-app/.env.local');
        expect(localEnv.toString()).toContain('REDIS_URL=localhost:6379');

        const packageJson = readJson(appTree, 'package.json');
        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['ioredis', 'uuid']),
        );
        expect(Object.keys(packageJson.devDependencies)).toEqual(
            expect.arrayContaining(['@types/uuid']),
        );
    });

    it('should generate redis adapter lib with custom env var name', async () => {
        await generator(appTree, {
            ...options,
            redisAdapter: true,
            redisEnvVar: 'REDIS_CONNECTION_STRING',
        });

        const nextAuthTs = appTree.read(
            'next-app/pages/api/auth/[...nextauth].ts',
        );
        expect(nextAuthTs.toString()).toMatchSnapshot();

        const localEnv = appTree.read('next-app/.env.local');
        expect(localEnv.toString()).toContain(
            'REDIS_CONNECTION_STRING=localhost:6379',
        );

        const redisAdapterTest = appTree.read(
            'next-auth-redis/src/index.test.ts',
        );
        expect(redisAdapterTest.toString()).toContain(
            'new Redis(process.env.REDIS_CONNECTION_STRING)',
        );
    });

    it('should generate redis adapter lib with custom name', async () => {
        await generator(appTree, {
            ...options,
            redisAdapter: true,
            redisEnvVar: 'REDIS_URL',
            redisAdapterName: 'redis-adapter-for-next-auth',
        });

        const nextAuthTs = appTree.read(
            'next-app/pages/api/auth/[...nextauth].ts',
        );
        expect(nextAuthTs.toString()).toMatchSnapshot();

        expect(
            appTree.exists('redis-adapter-for-next-auth/src/index.ts'),
        ).toBeTruthy();
    });

    it('should skip installing depndencies', async () => {
        await generator(appTree, { ...options, skipPackageJson: true });

        const packageJson = readJson(appTree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).not.toEqual(
            expect.arrayContaining(['next-auth']),
        );
    });
});
