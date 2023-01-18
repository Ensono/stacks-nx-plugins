import { Tree, GeneratorCallback, formatFiles } from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';

import { InstallGeneratorSchema } from './schema.d';
import { addCommitizen } from './utils/commitizen';
import { addCommitlint } from './utils/commitlint';
import { addEslint } from './utils/eslint';
import { addHusky } from './utils/husky';
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
        tasks.push(addHusky(tree, options));
    }

    if (options.eslint) {
        tasks.push(addEslint(tree));
    }

    // Create tsconfig.base if it doesn't exist
    createTsConfigBase(tree);

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
