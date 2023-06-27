import { verifyPluginCanBeInstalled } from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    formatFiles,
    generateFiles,
    getProjects,
    offsetFromRoot,
    Tree,
} from '@nx/devkit';
import path from 'path';

import { AccessibilityGeneratorSchema } from './schema';
import {
    AXE_CORE_PLAYWRIGHT_VERSION,
    AXE_RESULTS_PRETTY_PRINT_VERSION,
} from '../../utils/versions';

interface NormalizedSchema extends AccessibilityGeneratorSchema {
    projectName: string;
    projectRoot: string;
}

function normalizeOptions(
    tree: Tree,
    options: AccessibilityGeneratorSchema,
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

async function updateDependencies(tree: Tree) {
    const accessibilityDeps = {
        '@axe-core/playwright': AXE_CORE_PLAYWRIGHT_VERSION,
        'axe-result-pretty-print': AXE_RESULTS_PRETTY_PRINT_VERSION,
    };

    return addDependenciesToPackageJson(tree, {}, accessibilityDeps);
}

export default async function accessibilityGenerator(
    tree: Tree,
    options: AccessibilityGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    const project = getProjects(tree).get(options.project);

    if (!project) {
        throw new Error(`${options.project} does not exist.`);
    }

    if (!options.project.endsWith('-e2e')) {
        throw new Error(
            `${options.project} is not an e2e project. Please select a supported target.`,
        );
    }

    const normalizedOptions = normalizeOptions(tree, options);

    // generate acessiblity files
    addFiles(tree, 'files', normalizedOptions);

    await formatFiles(tree);

    return updateDependencies(tree);
}
