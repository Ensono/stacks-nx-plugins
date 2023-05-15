import { tsMorphTree } from '@ensono-stacks/core';
import { addStacksAttributes } from '@ensono-stacks/test';
import { joinPathFragments, readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';
import { Schema as NextSchema } from '@nrwl/next/src/generators/application/schema';
import exp from 'constants';
import * as fs from 'fs';
import path from 'path';
import { SourceFile } from 'ts-morph';

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
