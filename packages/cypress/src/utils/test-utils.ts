import { addStacksAttributes } from '@ensono-stacks/test';
import {
    generateFiles,
    getProjects,
    joinPathFragments,
    offsetFromRoot,
    Tree,
} from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';
import { Schema as NextSchema } from '@nrwl/next/src/generators/application/schema';
import path from 'path';

import { CypressGeneratorSchema } from '../generators/init/schema';

export interface NormalizedSchema extends CypressGeneratorSchema {
    projectName: string;
    projectRoot: string;
    cypressProject: string;
}

export async function createNextApp(
    applicationName: string,
    schema?: Partial<NextSchema>,
) {
    const appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    await applicationGenerator(appTree, {
        name: applicationName,
        style: 'css',
        e2eTestRunner: 'none',
        ...schema,
    });

    addStacksAttributes(appTree, applicationName);
    return appTree;
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
        cypressProject: joinPathFragments(
            project?.sourceRoot as string,
            'cypress',
        ),
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
