import { tsMorphTree } from '@ensono-stacks/core';
import {
    addStacksAttributes,
    checkFilesExistInTree,
} from '@ensono-stacks/test';
import { joinPathFragments, readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { SyntaxKind } from 'ts-morph';

import generator from './generator';
import { PlaywrightGeneratorSchema } from './schema';

const projectName = 'test';
const projectNameE2E = `${projectName}-e2e`;

jest.mock('@nx/devkit', () => {
    const actual = jest.requireActual('@nx/devkit');

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

function snapshotFiles(tree, files: string[]) {
    expect(() => checkFilesExistInTree(tree, ...files)).not.toThrowError();
    const project = tsMorphTree(tree);
    files.forEach(file => {
        expect(project.addSourceFileAtPath(file).getText()).toMatchSnapshot(
            file,
        );
    });
}

describe('playwright generator', () => {
    let appTree: Tree;
    let options: PlaywrightGeneratorSchema;

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

        snapshotFiles(appTree, [
            joinPathFragments(projectNameE2E, 'project.json'),
            joinPathFragments(projectNameE2E, 'playwright.config.ts'),
            joinPathFragments(projectNameE2E, 'tsconfig.e2e.json'),
            joinPathFragments(projectNameE2E, 'tsconfig.json'),
            joinPathFragments(projectNameE2E, '.eslintrc.json'),
            joinPathFragments(projectNameE2E, 'src', 'example.spec.ts'),
            'playwright.config.base.ts',
        ]);
        // app.spec.ts to be removed
        expect(
            appTree.exists(
                joinPathFragments(projectNameE2E, 'src', 'app.spec.ts'),
            ),
        ).toBeFalsy();

        // expect .gitignore entries to be added
        const gitIgnoreFile = appTree.read('/.gitignore', 'utf8');
        expect(gitIgnoreFile).toContain('**/test-results');
        expect(gitIgnoreFile).toContain('**/playwright-report');
        expect(gitIgnoreFile).toContain('**/playwright/.cache');

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
                ].includes('PlaywrightInit'),
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
