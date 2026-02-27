import { addStacksAttributes } from '@ensono-stacks/test';
import { readJson, Tree, updateJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import chalk from 'chalk';
import { vi } from 'vitest';

import {
    hasGeneratorExecutedForProject,
    hasGeneratorExecutedForWorkspace,
} from './hasGeneratorExecuted';

describe('hasGeneratorExecuted', () => {
    let appTree: Tree;
    const projectName = 'testProject';
    const generatorName = 'testGenerator';

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        addStacksAttributes(appTree, '');
    });

    describe('hasGeneratorExecutedForProject', () => {
        it('should add entry on first run', async () => {
            hasGeneratorExecutedForProject(appTree, projectName, generatorName);

            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project.testProject,
            ).toContain(generatorName);
        });

        it('should log warning if re-run', async () => {
            const logSpy = vi.spyOn(console, 'log');

            updateJson(appTree, 'nx.json', nxJson => ({
                ...nxJson,
                stacks: {
                    ...nxJson.stacks,
                    executedGenerators: {
                        ...nxJson.stacks.executedGenerators,
                        project: {
                            testProject: [generatorName],
                        },
                    },
                },
            }));

            hasGeneratorExecutedForProject(appTree, projectName, generatorName);

            expect(logSpy).toHaveBeenCalledWith(
                '\n',
                chalk.yellow(
                    `This generator has already been executed for the project`,
                ),
                chalk.magenta(`testProject.`),
                chalk.yellow(`No changes made.`),
                '\n',
            );
        });
    });

    describe('hasGeneratorExecutedForWorkspace', () => {
        it('should add entry on first run', async () => {
            hasGeneratorExecutedForWorkspace(appTree, generatorName);

            const nxJson = readJson(appTree, 'nx.json');

            expect(nxJson.stacks.executedGenerators.workspace).toContain(
                generatorName,
            );
        });

        it('should log warning if re-run', async () => {
            const logSpy = vi.spyOn(console, 'log');

            updateJson(appTree, 'nx.json', nxJson => ({
                ...nxJson,
                stacks: {
                    ...nxJson.stacks,
                    executedGenerators: {
                        ...nxJson.stacks.executedGenerators,
                        workspace: [generatorName],
                    },
                },
            }));

            hasGeneratorExecutedForWorkspace(appTree, generatorName);

            expect(logSpy).toHaveBeenCalledWith(
                '\n',
                chalk.yellow(
                    `This generator has already been executed for the workspace`,
                ),
                chalk.magenta(`proj.`),
                chalk.yellow(`No changes made.`),
                '\n',
            );
        });
    });
});
