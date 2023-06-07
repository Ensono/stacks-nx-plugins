import { addStacksAttributes } from '@ensono-stacks/test';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';
import { Schema as NextSchema } from '@nrwl/next/src/generators/application/schema';

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
