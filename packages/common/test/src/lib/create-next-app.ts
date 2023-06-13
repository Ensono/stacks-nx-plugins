import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nrwl/next';
import { Schema as NextSchema } from '@nrwl/next/src/generators/application/schema';

import { addStacksAttributes } from './stacks-attributes';

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
