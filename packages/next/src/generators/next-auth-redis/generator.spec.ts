import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree, readJson, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';

import nextInitGenerator from '../init/generator';
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
        });
        addStacksAttributes(appTree, options.project);
        await nextInitGenerator(appTree, { project: 'next-app' });
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

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await generator(appTree, {
                ...options,
                adapterName: 'redis-adapter-for-next-auth',
            });
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('NextAuthRedis'),
            ).toBe(true);
        });

        it('should return false from method and exit generator if already executed', async () => {
            const gen = await generator(appTree, {
                ...options,
            });

            expect(gen).toBe(false);
        });
    });
});
