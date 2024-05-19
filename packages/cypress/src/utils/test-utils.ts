import {
    generateFiles,
    getProjects,
    joinPathFragments,
    offsetFromRoot,
    Tree,
} from '@nx/devkit';
import path from 'path';

import { CypressGeneratorSchema } from '../generators/init/schema';

export interface NormalizedSchema extends CypressGeneratorSchema {
    projectName: string;
    projectRoot: string;
    cypressProject: string;
}

export function checkOneOccurence(array: any[], value: any) {
    return array.filter(element => element === value).length === 1;
}

export function normalizeOptions(
    tree: Tree,
    options: CypressGeneratorSchema,
): NormalizedSchema {
    const project = getProjects(tree).get(options.project);

    if (!project) {
        throw new Error(`${options.project} does not exist.`);
    }

    return {
        ...options,
        projectName: project?.name as string,
        projectRoot: project?.sourceRoot as string,
        cypressProject: `${project?.sourceRoot}-e2e`,
    };
}

export function addFiles(
    tree: Tree,
    source: string,
    dirname: string,
    destination: string,
    options: NormalizedSchema,
) {
    const templateOptions = {
        ...options,
        offsetFromRoot: offsetFromRoot(options.projectRoot),
        template: '',
    };

    generateFiles(
        tree,
        path.join(dirname, source),
        destination,
        templateOptions,
    );
}
