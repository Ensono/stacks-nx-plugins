import { deploymentGeneratorMessage, tsMorphTree } from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    getProjects,
    offsetFromRoot,
    readProjectConfiguration,
    Tree,
} from '@nrwl/devkit';
import path from 'path';

import { visualRegressionTypes } from '../../utils/types';
import { APPLITOOLS_EYES_PLAYWRIGHT_VERSION } from '../../utils/versions';
import { VisualRegressionGeneratorSchema } from './schema';
import {
    updatePlaywrightConfigWithApplitoolsVisualRegression,
    updatePlaywrightConfigWithNativeVisualRegression,
} from './utils/update-playwright-config';
import { updateProjectJsonWithNativeVisualRegressionTargets } from './utils/update-targets';

interface NormalizedSchema extends VisualRegressionGeneratorSchema {
    projectName: string;
    projectRoot: string;
}

function normalizeOptions(
    tree: Tree,
    options: VisualRegressionGeneratorSchema,
): NormalizedSchema {
    const project = getProjects(tree).get(options.project);

    return {
        ...options,
        projectName: project?.name as string,
        projectRoot: project?.sourceRoot as string,
    };
}

function addFiles(tree: Tree, source: string, options: NormalizedSchema) {
    const templateOptions = {
        ...options,
        offsetFromRoot: offsetFromRoot(options.projectRoot),
        template: '',
    };

    generateFiles(
        tree,
        path.join(__dirname, source),
        options.projectRoot,
        templateOptions,
    );
}

async function updateDependencies(tree: Tree, type: string) {
    const applitoolsDeps = {
        '@applitools/eyes-playwright': APPLITOOLS_EYES_PLAYWRIGHT_VERSION,
    };

    if (type === visualRegressionTypes.APPLITOOLS) {
        return addDependenciesToPackageJson(tree, {}, applitoolsDeps);
    }
    return false;
}

export default async function visualRegressionGenerator(
    tree: Tree,
    options: VisualRegressionGeneratorSchema,
) {
    const project = getProjects(tree).get(options.project);

    if (!project) {
        throw new Error(`${options.project} does not exist.`);
    }

    const normalizedOptions = normalizeOptions(tree, options);

    const morphTree = tsMorphTree(tree);

    switch (options.type) {
        case visualRegressionTypes.NATIVE:
            // update project.json with new visual target
            updateProjectJsonWithNativeVisualRegressionTargets(
                readProjectConfiguration(tree, options.project),
                tree,
            );

            // update targets
            updatePlaywrightConfigWithNativeVisualRegression(morphTree);

            // example.spec.ts
            addFiles(tree, 'files/native', normalizedOptions);
            break;
        case visualRegressionTypes.APPLITOOLS:
            // add extra to playwright.config.ts in project
            updatePlaywrightConfigWithApplitoolsVisualRegression(
                readProjectConfiguration(tree, options.project),
                morphTree,
            );

            // example.spec.ts
            addFiles(tree, 'files/applitools', normalizedOptions);
            break;
        default:
    }

    await formatFiles(tree);

    deploymentGeneratorMessage(
        tree,
        'nx g @ensono-stacks/playwright:visual-regression-deployment',
    );

    return updateDependencies(tree, options.type);
}
