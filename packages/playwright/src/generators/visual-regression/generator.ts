import {
    hasGeneratorExecutedForProject,
    tsMorphTree,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    getProjects,
    offsetFromRoot,
    readProjectConfiguration,
    Tree,
    runTasksInSerial,
} from '@nx/devkit';
import path from 'path';

import { VisualRegressionGeneratorSchema } from './schema';
import {
    updatePlaywrightConfigWithApplitoolsVisualRegression,
    updatePlaywrightConfigWithDefault,
} from './utils/update-playwright-config';
import { updateProjectJsonWithNativeVisualRegressionTargets } from './utils/update-targets';
import { visualRegressionTypes } from '../../utils/types';
import { APPLITOOLS_EYES_PLAYWRIGHT_VERSION } from '../../utils/versions';

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

function updateDependencies(tree: Tree, type: string) {
    const applitoolsDeps = {
        '@applitools/eyes-playwright': APPLITOOLS_EYES_PLAYWRIGHT_VERSION,
    };
    const dependencies =
        type === visualRegressionTypes.APPLITOOLS ? applitoolsDeps : {};

    return addDependenciesToPackageJson(tree, {}, dependencies);
}

export default async function visualRegressionGenerator(
    tree: Tree,
    options: VisualRegressionGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    if (
        hasGeneratorExecutedForProject(
            tree,
            options.project,
            'PlaywrightVisualRegression',
            true,
        )
    )
        return false;

    if (!options.project.endsWith('-e2e')) {
        throw new Error(
            `${options.project} is not an e2e project. Please select a supported target.`,
        );
    }

    const project = getProjects(tree).get(options.project);

    if (!project) {
        throw new Error(`${options.project} does not exist.`);
    }

    const normalizedOptions = normalizeOptions(tree, options);
    const morphTree = tsMorphTree(tree);

    switch (options.type) {
        case visualRegressionTypes.NATIVE: {
            // update project.json with new visual target
            updateProjectJsonWithNativeVisualRegressionTargets(
                readProjectConfiguration(tree, options.project),
                tree,
            );

            // update targets
            updatePlaywrightConfigWithDefault(
                readProjectConfiguration(tree, options.project),
                morphTree,
            );
            // example.spec.ts
            addFiles(tree, 'files/native', normalizedOptions);
            break;
        }
        case visualRegressionTypes.APPLITOOLS: {
            // add extra to playwright.config.ts in project
            updatePlaywrightConfigWithApplitoolsVisualRegression(
                readProjectConfiguration(tree, options.project),
                morphTree,
            );

            // update targets
            updatePlaywrightConfigWithDefault(
                readProjectConfiguration(tree, options.project),
                morphTree,
            );

            // example.spec.ts
            addFiles(tree, 'files/applitools', normalizedOptions);
            break;
        }
        default:
    }

    await formatFiles(tree);

    return runTasksInSerial(updateDependencies(tree, options.type));
}
