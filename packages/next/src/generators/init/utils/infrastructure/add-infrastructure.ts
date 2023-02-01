import { addGitIgnoreEntry } from '@ensono-stacks/core';
import { ProjectConfiguration, Tree, GeneratorCallback } from '@nrwl/devkit';

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

    return tasks;
}
