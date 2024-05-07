import { addStacksAttributes } from '@ensono-stacks/test';
import { readJson, Tree, updateJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/next';

import generator from './generator';
import { NextAuthRedisDeploymentGeneratorSchema } from './schema';
import nextInitGenerator from '../init/generator';
import nextAuthGenerator from '../next-auth/generator';

jest.mock('@ensono-stacks/core', () => ({
    ...jest.requireActual('@ensono-stacks/core'),
    execAsync: jest.fn(),
    getCommandVersion: jest.fn(() => '1.0.0'),
}));

describe('next-auth-redis-deployment generator', () => {
    let appTree: Tree;
    const options: NextAuthRedisDeploymentGeneratorSchema = {
        project: 'next-app',
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

    it('should generate redis helm deploy values', async () => {
        await generator(appTree, options);

        expect(
            appTree.exists('next-app/deploy/helm/nonprod/redis.yaml'),
        ).toBeTruthy();
        expect(
            appTree.exists('next-app/deploy/helm/prod/redis.yaml'),
        ).toBeTruthy();

        const helmRedisValues = appTree.read(
            'next-app/deploy/helm/nonprod/redis.yaml',
        );
        expect(helmRedisValues.toString()).toContain('REDIS_URL');
        expect(helmRedisValues.toString()).toContain('next-app');
    });

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await generator(appTree, {
                ...options,
            });
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('NextAuthRedisDeployment'),
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
