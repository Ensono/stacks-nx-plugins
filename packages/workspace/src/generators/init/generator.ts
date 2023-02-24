import { Tree, GeneratorCallback, formatFiles } from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';

import { InstallGeneratorSchema } from './schema';
import { addCommitizen } from './utils/commitizen';
import { addCommitlint } from './utils/commitlint';
import { addEslint } from './utils/eslint';
import { addHusky } from './utils/husky';
import { addLintStaged } from './utils/lint-staged';
import { addPipeline } from './utils/pipeline';
import { setDefaults } from './utils/set-defaults';
import { createTsConfigBase } from './utils/tsconfig';

export default async function install(
    tree: Tree,
    options: InstallGeneratorSchema,
) {
    const tasks: GeneratorCallback[] = [];

    if (options.commitizen) {
        tasks.push(addCommitlint(tree), addCommitizen(tree, options));
    }

    if (options.husky) {
        tasks.push(addLintStaged(tree), addHusky(tree, options));
    }

    if (options.eslint) {
        tasks.push(addEslint(tree));
    }

    if (options.pipelineRunner !== 'none') {
        tasks.push(addPipeline(tree, options));
    }

    setDefaults(tree, options);
    // Create tsconfig.base if it doesn't exist
    createTsConfigBase(tree);

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
