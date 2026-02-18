import { readJson, Tree, updateJson } from '@nx/devkit';
import chalk from 'chalk';

import {
    tagExecutedGeneratorForProject,
    tagExecutedGeneratorForWorkspace,
} from './tagExecutedGenerator';
import { readStacksExecutedGenerators } from '../lib/stacks';

export function getNpmScope(tree: Tree) {
    const { name } = tree.exists('package.json')
        ? readJson(tree, 'package.json')
        : { name: null };

    if (typeof name !== 'string') {
        return null;
    }

    return name.startsWith('@') ? name.split('/')[0].slice(1) : null;
}

export function isGeneratorInExecutedListForProject(
    tree: Tree,
    projectName: string,
    generatorName: string,
    throwError = false,
): boolean {
    const stacksExecutedGeneratorsUpdated = readStacksExecutedGenerators(tree);

    const found =
        stacksExecutedGeneratorsUpdated.project[projectName].includes(
            generatorName,
        );
    if (!found && throwError) {
        throw new Error(
            `The dependent ${generatorName} generator has not been executed`,
        );
    }

    return found;
}

export function hasGeneratorExecutedForProject(
    tree: Tree,
    projectName: string,
    generatorName: string,
    notifyUser = false,
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

    const generatorExecuted = isGeneratorInExecutedListForProject(
        tree,
        projectName,
        generatorName,
    );
    if (generatorExecuted) {
        console.log(
            '\n',
            chalk.yellow`This generator has already been executed for the project`,
            chalk.magenta`${projectName}.`,
            chalk.yellow`No changes made.`,
            '\n',
        );
        if (notifyUser)
            console.log(
                '\n',
                chalk.yellow`If you wish to run this generator again, please delete the entry`,
                chalk.magenta`'${generatorName}'`,
                chalk.yellow`for`,
                chalk.magenta`'${projectName}'`,
                chalk.yellow`in`,
                chalk.magenta`nx.json`,
                chalk.yellow`under`,
                chalk.magenta`stacks.executedGenerators.project`,
                chalk.yellow`and verify the new output is as expected on re-run`,
                '\n',
            );
    } else {
        tagExecutedGeneratorForProject(tree, projectName, generatorName);
    }

    return generatorExecuted;
}

export function hasGeneratorExecutedForWorkspace(
    tree: Tree,
    generatorName: string,
    notifyUser = false,
) {
    const stacksExecutedGenerators = readStacksExecutedGenerators(tree);

    const generatorExecuted =
        stacksExecutedGenerators.workspace.includes(generatorName);

    if (generatorExecuted) {
        console.log(
            '\n',
            chalk.yellow`This generator has already been executed for the workspace`,
            chalk.magenta`${getNpmScope(tree)}.`,
            chalk.yellow`No changes made.`,
            '\n',
        );
        if (notifyUser)
            console.log(
                '\n',
                chalk.yellow`If you wish to run this generator again, please delete the entry`,
                chalk.magenta`'${generatorName}'`,
                chalk.yellow`in`,
                chalk.magenta`nx.json`,
                chalk.yellow`under`,
                chalk.magenta`stacks.executedGenerators.workspace`,
                chalk.yellow`and verify the new output is as expected on re-run`,
                '\n',
            );
    } else {
        tagExecutedGeneratorForWorkspace(tree, generatorName);
    }

    return generatorExecuted;
}
