import { ProjectConfiguration, TargetConfiguration } from '@nrwl/devkit';

function isObject(a: unknown) {
    return typeof a === 'object' && !Array.isArray(a);
}

function coalesceByKey(source: Record<string, unknown>) {
    return (accumulator: Record<string, unknown>, key: string) => {
        if (accumulator[key] && source[key]) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            accumulator[key] = merge(accumulator[key], source[key]);
        } else {
            accumulator[key] = source[key];
        }

        return accumulator;
    };
}

function deepMerge(
    target: Record<string, any>,
    ...sources: Record<string, any>[]
) {
    return sources.reduce(
        (accumulator, source) =>
            Object.keys(source).reduce(coalesceByKey(source), accumulator),
        target,
    );
}

function merge(a: unknown, b: unknown): unknown {
    return isObject(a) && isObject(b)
        ? deepMerge(a as Record<string, unknown>, b as Record<string, unknown>)
        : isObject(a) && !isObject(b)
        ? a
        : b;
}

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
    );

    return newConfig;
}
