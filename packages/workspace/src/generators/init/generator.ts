import {
    deploymentGeneratorMessage,
    hasGeneratorExecutedForWorkspace,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    Tree,
    GeneratorCallback,
    formatFiles,
    updateJson,
    runTasksInSerial,
} from '@nx/devkit';

import { InstallGeneratorSchema } from './schema';
import { addCommitizen } from './utils/commitizen';
import { addCommitlint } from './utils/commitlint';
import { addEslint } from './utils/eslint';
import { addHusky } from './utils/husky';
import { addLintStaged } from './utils/lint-staged';
import { addNVM } from './utils/nvm';
import { modifyReadme } from './utils/readme';
import { createTsConfigBase } from './utils/tsconfig';

export default async function install(
    tree: Tree,
    options: InstallGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree);

    if (hasGeneratorExecutedForWorkspace(tree, 'WorkspaceInit')) return false;

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

    if (options.nvm) {
        tasks.push(addNVM(tree));
    }

    // Create tsconfig.base if it doesn't exist
    createTsConfigBase(tree);

    // create stacks attribute if it doesn't exist
    updateJson(tree, 'nx.json', nxJson =>
        nxJson.stacks
            ? nxJson
            : {
                  ...nxJson,
                  stacks: {
                      ...nxJson.stacks,
                      executedGenerators: {
                          project: {},
                          workspace: [],
                      },
                  },
              },
    );

    // Create README.md if it doesn't exist
    modifyReadme(tree);

    await formatFiles(tree);

    return runTasksInSerial(...tasks);
}
