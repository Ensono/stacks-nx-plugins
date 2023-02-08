import deepMerge from 'deepmerge';

import { ensureArray } from './array';

function isObject(a: unknown) {
    return typeof a === 'object' && !Array.isArray(a);
}

function processUniqueKeyForObject(
    destination: any[],
    target: any[],
    index: number,
    item: any,
    uniqueKeyForObjects: string,
    options?: deepMerge.Options,
) {
    const result = [...destination];

    const itemWithUniqueInTarget = target.find(targetItem => {
        if (
            isObject(item[uniqueKeyForObjects]) ||
            isObject(targetItem[uniqueKeyForObjects])
        ) {
            return false;
        }
        const sourceItemClone = [...ensureArray(item[uniqueKeyForObjects])];
        const targetItemClone = [
            ...ensureArray(targetItem[uniqueKeyForObjects]),
        ];

        return (
            isObject(targetItem) &&
            targetItemClone.sort().toString() ===
                sourceItemClone.sort().toString()
        );
    });

    if (itemWithUniqueInTarget) {
        result[index] = deepMerge(target[index], item, options);
    } else {
        result.push(item);
    }

    return result;
}

function combineMerge(
    target: any[],
    source: any[],
    options?: deepMerge.Options,
    uniqueKeyForObjects?: string,
) {
    let destination = [...target];

    source.forEach((item, index) => {
        if (typeof destination[index] === 'undefined') {
            destination[index] = item;
        } else if (
            options?.isMergeableObject &&
            options.isMergeableObject(item)
        ) {
            if (uniqueKeyForObjects && item[uniqueKeyForObjects]) {
                destination = processUniqueKeyForObject(
                    destination,
                    target,
                    index,
                    item,
                    uniqueKeyForObjects,
                    options,
                );
            } else {
                destination[index] = deepMerge(target[index], item, options);
            }
        } else if (!target.includes(item)) {
            destination.push(item);
        }
    });
    return destination;
}

export default combineMerge;
