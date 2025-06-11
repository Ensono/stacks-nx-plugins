import { tsMorphTree } from '@ensono-stacks/core';
import {
    addStacksAttributes,
    checkFilesExistInTree,
} from '@ensono-stacks/test';
import {
    joinPathFragments,
    readJson,
    Tree,
    addProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import generator from './generator';
import { PlaywrightGeneratorSchema } from './schema';

const projectName = 'test';
const projectNameE2E = `${projectName}-e2e`;

function snapshotFiles(tree, files: string[]) {
    expect(() => checkFilesExistInTree(tree, ...files)).not.toThrow();
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
            directory: projectNameE2E,
        };
        appTree = createTreeWithEmptyWorkspace();
        addStacksAttributes(appTree, options.project);
        addProjectConfiguration(appTree, projectName, {
            projectType: 'application',
            sourceRoot: projectName,
            root: projectName,
        });
    });

    it('should resolve false if the project already exists', async () => {
        await generator(appTree, options);
        await expect(generator(appTree, options)).resolves.toBe(false);
    });

    it('should run successfully with default options', async () => {
        await generator(appTree, options);

        snapshotFiles(appTree, [
            joinPathFragments('.prettierrc'),
            joinPathFragments('package.json'),
            joinPathFragments('nx.json'),
            joinPathFragments('tsconfig.base.json'),
            joinPathFragments(projectNameE2E, 'src', 'example.spec.ts'),
            joinPathFragments(projectNameE2E, 'playwright.config.ts'),
        ]);

        expect(
            appTree.exists(
                joinPathFragments(
                    projectNameE2E,
                    'src',
                    'lib',
                    'test-e2e.spec.ts',
                ),
            ),
        ).toBeFalsy();

        // Add target to project.json
        const projectJson = readJson(
            appTree,
            joinPathFragments(projectNameE2E, 'project.json'),
        );
        expect(projectJson.targets.e2e).toBeTruthy();
    });

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
