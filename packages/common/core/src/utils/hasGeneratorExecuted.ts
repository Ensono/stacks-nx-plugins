import { getWorkspaceLayout, Tree, updateJson } from '@nrwl/devkit';
import chalk from 'chalk';

import { readStacksExecutedGenerators } from '../lib/stacks';
import {
    tagExecutedGeneratorForProject,
    tagExecutedGeneratorForWorkspace,
} from './tagExecutedGenerator';

export function hasGeneratorExecutedForProject(
    tree: Tree,
    projectName: string,
    generatorName: string,
) {
    const stacksExecutedGenerators = readStacksExecutedGenerators(tree);

    if (!(projectName in stacksExecutedGenerators.project))
        updateJson(tree, 'nx.json', nxJson => ({
            ...nxJson,
            stacks: {
                ...nxJson.stacks,
                executedGenerators: {
                    ...nxJson.stacks.executedGenerators,
                    project: {
                        ...nxJson.stacks.executedGenerators.project,
                        [projectName]: [],
                    },
                },
            },
        }));

    const stacksExecutedGeneratorsUpdated = readStacksExecutedGenerators(tree);

    const generatorExecuted =
        stacksExecutedGeneratorsUpdated.project[projectName].includes(
            generatorName,
        );

    if (!generatorExecuted) {
        tagExecutedGeneratorForProject(tree, projectName, generatorName);
    } else {
        console.log(
            '\n',
            chalk.yellow`This generator has already been executed for the project`,
            chalk.magenta`${projectName}.`,
            chalk.yellow`No changes made.`,
            '\n',
        );
    }

    return generatorExecuted;
}

export function hasGeneratorExecutedForWorkspace(
    tree: Tree,
    generatorName: string,
) {
    const stacksExecutedGenerators = readStacksExecutedGenerators(tree);

    const generatorExecuted =
        stacksExecutedGenerators.workspace.includes(generatorName);

    const workspace = getWorkspaceLayout(tree);

    if (!generatorExecuted) {
        tagExecutedGeneratorForWorkspace(tree, generatorName);
    } else {
        console.log(
            '\n',
            chalk.yellow`This generator has already been executed for the workspace`,
            chalk.magenta`${workspace.npmScope}.`,
            chalk.yellow`No changes made.`,
            '\n',
        );
    }

    return generatorExecuted;
}
