import { ProjectConfiguration, TargetConfiguration } from '@nrwl/devkit';
import deepMerge from 'deepmerge';

import combineMerge from './merge';

export function mergeProjectConfigTarget(
    config: ProjectConfiguration,
    target: TargetConfiguration,
    targetName: string,
): ProjectConfiguration {
    const newConfig = { ...config };

    if (!newConfig.targets) {
        newConfig.targets = {};
        newConfig.targets[targetName] = { ...target };
        return newConfig;
    }

    if (!newConfig.targets[targetName]) {
        newConfig.targets[targetName] = { ...target };
        return newConfig;
    }

    newConfig.targets[targetName] = deepMerge(
        newConfig.targets[targetName],
        target,
        { arrayMerge: combineMerge },
    );

    return newConfig;
}
