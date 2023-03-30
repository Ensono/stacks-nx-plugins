import { addStacksAttributes } from '@ensono-stacks/test';
import { readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import {
    tagExecutedGeneratorForProject,
    tagExecutedGeneratorForWorkspace,
} from './tagExecutedGenerator';

describe('hasGeneratorExecuted', () => {
    let appTree: Tree;
    const projectName = 'testProject';

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        addStacksAttributes(appTree, projectName);
    });

    describe('hasGeneratorExecutedForProject', () => {
        it('should add entry on execution', async () => {
            tagExecutedGeneratorForProject(
                appTree,
                projectName,
                'testGenerator',
            );

            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project.testProject,
            ).toContain('testGenerator');
        });
    });

    describe('hasGeneratorExecutedForWorkspace', () => {
        it('should add entry on execution', async () => {
            tagExecutedGeneratorForWorkspace(appTree, 'testGenerator');

            const nxJson = readJson(appTree, 'nx.json');

            expect(nxJson.stacks.executedGenerators.workspace).toContain(
                'testGenerator',
            );
        });
    });
});
