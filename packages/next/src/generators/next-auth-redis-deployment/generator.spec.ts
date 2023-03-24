import { testInitStacksConfig } from '@ensono-stacks/core';
import { readJson, Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';

import nextInitGenerator from '../init/generator';
import nextAuthGenerator from '../next-auth/generator';
import generator from './generator';
import { NextAuthRedisDeploymentGeneratorSchema } from './schema';

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
            standaloneConfig: false,
        });
        testInitStacksConfig(appTree, options.project);
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
