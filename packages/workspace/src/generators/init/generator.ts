import {
    deploymentGeneratorMessage,
    hasGeneratorExecutedForWorkspace,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import { Tree, GeneratorCallback, formatFiles, updateJson } from '@nx/devkit';
import { updateReadme } from '@nx/workspace/src/generators/move/lib/update-readme';
import { runTasksInSerial } from '@nx/workspace/src/utilities/run-tasks-in-serial';

import { InstallGeneratorSchema } from './schema';
import { addCommitizen } from './utils/commitizen';
import { addCommitlint } from './utils/commitlint';
import { addEslint } from './utils/eslint';
import { addHusky } from './utils/husky';
import { addLintStaged } from './utils/lint-staged';
import { addNVM } from './utils/nvm';
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

    // Update README.md file
    updateReadme(tree, {
        importPath: '',
        projectName: 'Ensono Stacks',
        destination: '',
        relativeToRootDestination: '',
        updateImportPath: false,
    });

    await formatFiles(tree);

    return runTasksInSerial(...tasks, () =>
        deploymentGeneratorMessage(
            tree,
            'nx g @ensono-stacks/workspace:init-deployment',
        ),
    );
}
