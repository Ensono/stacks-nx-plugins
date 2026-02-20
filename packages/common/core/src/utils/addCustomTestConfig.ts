import {
    ProjectConfiguration,
    Tree,
    updateProjectConfiguration,
} from '@nx/devkit';

import { mergeProjectConfigTarget } from '../lib/project-config';

export function addCustomTestConfig(
    tree: Tree,
    config: ProjectConfiguration,
    configurations?: { [config: string]: unknown },
) {
    const updatedConfig = mergeProjectConfigTarget(
        config,
        {
            configurations: {
                ...configurations,
            },
        },
        'test',
    );

    updateProjectConfiguration(tree, config.name as string, updatedConfig);
}
