import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree, updateJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import chalk from 'chalk';

import { executedDependantGenerator } from './executedDependantGenerator';

describe('executedDependantGenerator', () => {
    let appTree: Tree;
    const generatorName = 'testGenerator';

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        addStacksAttributes(appTree, '');
    });

    it('should return false if no prerequisite present', async () => {
        const logSpy = jest.spyOn(console, 'log');

        const result = executedDependantGenerator(appTree, generatorName);

        expect(logSpy).toHaveBeenCalledWith(
            '\n',
            chalk.yellow`The following generator is required as a prerequisite for this generator to work:`,
            chalk.magenta`testGenerator.`,
            chalk.yellow`No changes made.`,
            '\n',
        );

        expect(result).toBe(false);
    });

    it('should return true if prerequisite present in workspace', async () => {
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

        const result = executedDependantGenerator(appTree, generatorName);

        expect(result).toBe(true);
    });

    it('should return true if prerequisite present in project', async () => {
        updateJson(appTree, 'nx.json', nxJson => ({
            ...nxJson,
            stacks: {
                ...nxJson.stacks,
                executedGenerators: {
                    ...nxJson.stacks.executedGenerators,
                    workspace: [],
                    project: {
                        test: [generatorName],
                    },
                },
            },
        }));

        const result = executedDependantGenerator(
            appTree,
            generatorName,
            'test',
        );

        expect(result).toBe(true);
    });

    it('should return false if no prerequisite present for workspace and project', async () => {
        updateJson(appTree, 'nx.json', nxJson => ({
            ...nxJson,
            stacks: {
                ...nxJson.stacks,
                executedGenerators: {
                    ...nxJson.stacks.executedGenerators,
                    workspace: [],
                    project: {
                        test: [],
                    },
                },
            },
        }));

        const result = executedDependantGenerator(
            appTree,
            generatorName,
            'test',
        );

        expect(result).toBe(false);
    });
});
