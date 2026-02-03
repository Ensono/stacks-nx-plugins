import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/next';
import { Schema as NextSchema } from '@nx/next/src/generators/application/schema';

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
        directory: `apps/${applicationName}`,
        ...schema,
    });

    addStacksAttributes(appTree, applicationName);

    return appTree;
}
