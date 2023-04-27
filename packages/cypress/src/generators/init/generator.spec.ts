import { tsMorphTree } from '@ensono-stacks/core';
import { addStacksAttributes } from '@ensono-stacks/test';
import { joinPathFragments, readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import path from 'path';
import { SyntaxKind } from 'ts-morph';

import generator from './generator';
import { CypressGeneratorSchema } from './schema';

const projectName = 'test';
const projectNameE2E = `${projectName}-e2e`;

jest.mock('@nrwl/devkit', () => {
    const actual = jest.requireActual('@nrwl/devkit');

    return {
        ...actual,
        getProjects: jest.fn(
            () =>
                new Map([
                    [
                        'test',
                        {
                            root: '',
                            sourceRoot: `${projectName}`,
                            name: 'test',
                        },
                    ],
                ]),
        ),
    };
});

describe('cypress generator', () => {
    let appTree: Tree;
    let options: CypressGeneratorSchema;

    beforeEach(() => {
        options = {
            project: projectName,
        };
        appTree = createTreeWithEmptyWorkspace();
        addStacksAttributes(appTree, options.project);
    });

    it('should resolve false if the project already exists', async () => {
        await generator(appTree, options);
        await expect(generator(appTree, options)).resolves.toBe(false);
    }, 100_000);

    it('should run successfully with default options', async () => {
        await generator(appTree, options);

        expect(
            appTree.exists(path.join(projectNameE2E, 'cypress.config.ts')),
        ).toBeTruthy();

        // expect .gitignore entries to be added
        // const gitIgnoreFile = appTree.read('/.gitignore', 'utf-8');
        // expect(gitIgnoreFile).toContain('**/test-results');
        // expect(gitIgnoreFile).toContain('**/playwright-report');
        // expect(gitIgnoreFile).toContain('**/playwright/.cache');

        // Add target to project.json
        const projectJson = readJson(
            appTree,
            joinPathFragments(projectNameE2E, 'project.json'),
        );
        expect(projectJson.targets.e2e).toBeTruthy();
    }, 100_000);

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await generator(appTree, options);
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('CypressInit'),
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
