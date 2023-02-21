import { Tree, readJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';

import nextAuthGenerator from '../next-auth/generator';
import generator from './generator';
import { NextAuthRedisGeneratorSchema } from './schema';

describe('next-auth-redis generator', () => {
    let appTree: Tree;
    const options: NextAuthRedisGeneratorSchema = {
        project: 'next-app',
        envVar: 'REDIS_URL',
        adapterName: 'next-auth-redis',
    };

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        await applicationGenerator(appTree, {
            name: 'next-app',
            style: 'css',
            standaloneConfig: false,
        });
        await nextAuthGenerator(appTree, {
            project: 'next-app',
            provider: 'none',
        });
    });

    it('should generate redis adapter lib', async () => {
        await generator(appTree, options);

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
            envVar: 'REDIS_CONNECTION_STRING',
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
            adapterName: 'redis-adapter-for-next-auth',
        });

        const nextAuthTs = appTree.read(
            'next-app/pages/api/auth/[...nextauth].ts',
        );
        expect(nextAuthTs.toString()).toMatchSnapshot();

        expect(
            appTree.exists('redis-adapter-for-next-auth/src/index.ts'),
        ).toBeTruthy();
    });
});
