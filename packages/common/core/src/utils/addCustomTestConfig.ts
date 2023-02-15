import {
    ProjectConfiguration,
    Tree,
    updateProjectConfiguration,
} from '@nrwl/devkit';

import { mergeProjectConfigTarget } from '../lib/project-config';

export async function addCustomTestConfig(
    tree: Tree,
    projectConfig: ProjectConfiguration,
    projectConfigDestination: string,
    configurations?: { [config: string]: unknown },
) {
    const updatedConfig = mergeProjectConfigTarget(
        projectConfig,
        {
            configurations: {
                ...configurations,
            },
        },
        'test',
    );
    updateProjectConfiguration(tree, projectConfigDestination, updatedConfig);
}