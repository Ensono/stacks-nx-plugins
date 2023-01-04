import { formatFiles, getProjects, Tree } from '@nrwl/devkit';

import { NextGeneratorSchema } from './schema';
import { addEslint } from './utils/eslint';

export default async function installGenerator(
    tree: Tree,
    options: NextGeneratorSchema,
) {
    const project = getProjects(tree).get(options.project);

    if (!project) {
        throw new Error(
            `Cannot find the ${options.project} project. Please double check the project name.`,
        );
    }

    addEslint(tree, project.sourceRoot);

    await formatFiles(tree);
}
