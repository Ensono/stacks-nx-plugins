import { addIgnoreEntry } from '@ensono-stacks/core';
import {
    logger,
    ProjectConfiguration,
    Tree,
    GeneratorCallback,
    joinPathFragments,
} from '@nx/devkit';

import { addCommon } from './common';
import { addTerraform } from './terraform';
import { NextGeneratorSchema } from '../schema';

export function addInfrastructure(
    tree: Tree,
    project: ProjectConfiguration,
    options: NextGeneratorSchema,
) {
    const tasks: GeneratorCallback[] = [
        addCommon(tree, options),
        addTerraform(tree, options),
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
        `${joinPathFragments(
            'libs',
            options.libraryName,
            'build',
            'helm',
            '**',
            '*.yaml',
        )}`,
    ]);

    tasks.push(() => {
        logger.warn(
            `Review the infrastructure files in ${project.root}/deploy/. Search for "%REPLACE%" and make any necessary changes.`,
        );
    });

    return tasks;
}
