import { addIgnoreEntry } from '@ensono-stacks/core';
import {
    logger,
    ProjectConfiguration,
    Tree,
    GeneratorCallback,
    joinPathFragments,
} from '@nrwl/devkit';

import { NextGeneratorSchema } from '../schema';
import { addCommon } from './common';
import { addTerraform } from './terraform';

export function addInfrastructure(
    tree: Tree,
    project: ProjectConfiguration,
    options: NextGeneratorSchema,
) {
    const tasks: GeneratorCallback[] = [
        addCommon(tree, project),
        addTerraform(tree, project, options),
    ];

    addIgnoreEntry(tree, '.gitignore', 'Terraform', [
        '**/.terraform/*',
        '*.tfstate',
        '*.tfstate.*',
        'crash.log',
        'crash.*.log',
        'override.tf',
        'override.tf.json',
        '*_override.tf',
        '*_override.tf.json',
        '.terraformrc',
        'terraform.rc',
    ]);

    // add helm yaml files to prettierignore
    addIgnoreEntry(tree, '.prettierignore', 'helm yaml', [
        `${joinPathFragments(project.root, 'build', 'helm', '**', '*.yaml')}`,
    ]);

    tasks.push(() => {
        logger.warn(
            `Review the infrastructure files in ${project.root}/build/. Search for "%REPLACE% and make any necessary changes.`,
        );
    });

    return tasks;
}
