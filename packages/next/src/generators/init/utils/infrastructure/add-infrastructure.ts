import { ProjectConfiguration, Tree, GeneratorCallback } from '@nrwl/devkit';

import { addCommon } from './common';
import { addTerraform } from './terraform';

export function addInfrastructure(tree: Tree, project: ProjectConfiguration) {
    const tasks: GeneratorCallback[] = [
        addCommon(tree, project),
        addTerraform(tree, project),
    ];

    return tasks;
}
