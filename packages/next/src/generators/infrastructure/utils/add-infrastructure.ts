import { addGitIgnoreEntry } from '@ensono-stacks/core';
import {
    logger,
    ProjectConfiguration,
    Tree,
    GeneratorCallback,
} from '@nrwl/devkit';

import { addCommon } from './common';
import { addTerraform } from './terraform';

export function addInfrastructure(tree: Tree, project: ProjectConfiguration) {
    const tasks: GeneratorCallback[] = [
        addCommon(tree, project),
        addTerraform(tree, project),
    ];

    addGitIgnoreEntry(tree, 'Terraform', [
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

    tasks.push(() => {
        logger.warn(
            `Review the infrastructure files in ${project.root}/build/. Search for "%REPLACE% and make any necessary changes.`,
        );
    });

    return tasks;
}
