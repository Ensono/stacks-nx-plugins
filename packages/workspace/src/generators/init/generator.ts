import { readStacksConfig } from '@ensono-stacks/core';
import { Tree, GeneratorCallback, formatFiles } from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import chalk from 'chalk';

import { InstallGeneratorSchema } from './schema';
import { addCommitizen } from './utils/commitizen';
import { addCommitlint } from './utils/commitlint';
import { addEslint } from './utils/eslint';
import { addHusky } from './utils/husky';
import { addPipeline } from './utils/pipeline';
import { setDefaults } from './utils/set-defaults';
import { createTsConfigBase } from './utils/tsconfig';

export default async function install(
    tree: Tree,
    options: InstallGeneratorSchema,
) {
    const tasks: GeneratorCallback[] = [];
    const { commitizen, husky, eslint } = options;
    let { pipelineRunner } = options;

    // check if stacks have been configured in nx.json
    try {
        readStacksConfig(tree);
    } catch {
        if (pipelineRunner !== 'none') {
            console.log(
                chalk.yellow`Skipping --pipelineRunner=${pipelineRunner} because Stacks config is missing in nx.json. Have you configured using stacks-cli?`,
            );
            pipelineRunner = 'none';
        }
    }

    if (commitizen) {
        tasks.push(addCommitlint(tree), addCommitizen(tree, options));
    }

    if (husky) {
        tasks.push(addHusky(tree, options));
    }

    if (eslint) {
        tasks.push(addEslint(tree));
    }

    if (pipelineRunner !== 'none') {
        tasks.push(addPipeline(tree, options));
    }

    setDefaults(tree, options);
    // Create tsconfig.base if it doesn't exist
    createTsConfigBase(tree);

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
