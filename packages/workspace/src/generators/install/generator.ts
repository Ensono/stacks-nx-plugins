import { Tree, GeneratorCallback } from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';

import { InstallGeneratorSchema } from './schema';
import { addCommitizen } from './utils/commitizen';
import { addCommitlint } from './utils/commitlint';
import { addEslint } from './utils/eslint';
import { addHusky } from './utils/husky';

export default async function (tree: Tree, options: InstallGeneratorSchema) {
  const tasks: GeneratorCallback[] = [];

  if (options.eslint) {
    tasks.push(addEslint(tree));
  }

  if (options.commitizen) {
    tasks.push(addCommitlint(tree));
    tasks.push(addCommitizen(tree, options));
  }

  if (options.husky) {
    tasks.push(addHusky(tree, options));
  }

  return runTasksInSerial(...tasks);
}
