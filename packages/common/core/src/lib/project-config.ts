import { ProjectConfiguration, TargetConfiguration } from '@nrwl/devkit';

function isObject(a: unknown) {
    return typeof a === 'object' && !Array.isArray(a);
}

function coalesceByKey(source: any) {
    // eslint-disable-next-line no-return-assign
    return (accumulator: Record<string, any>, key: string) =>
        (accumulator[key] && source[key]
            ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
              (accumulator[key] = merge(accumulator[key], source[key]))
            : (accumulator[key] = source[key])) && accumulator;
}

function deepMerge(target: any, ...sources: any[]) {
    return sources.reduce(
        (accumulator, source) =>
            Object.keys(source as object).reduce(
                coalesceByKey(source),
                accumulator,
            ),
        target,
    );
}

function merge(a: any, b: any): unknown {
    return isObject(a) && isObject(b)
        ? deepMerge(a, b)
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
