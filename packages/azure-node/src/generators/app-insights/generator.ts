import {
    tsMorphTree,
    addIgnoreEntry,
    formatFiles,
    thirdPartyDependencyWarning,
    hasGeneratorExecutedForProject,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    getProjects,
    joinPathFragments,
    Tree,
    runTasksInSerial,
} from '@nx/devkit';
import chalk from 'chalk';
import path from 'path';

import { AppInsightsGeneratorSchema } from './schema';
import {
    initAppInsights,
    configureAppInsights,
    startAppInsights,
} from './templates/appInsights';
import { appInsightsVersion } from '../../utils/versions';

function updateDependencies(tree: Tree) {
    return addDependenciesToPackageJson(
        tree,
        {
            applicationinsights: appInsightsVersion,
        },
        {},
    );
}

export default async function appInsightsGenerator(
    tree: Tree,
    options: AppInsightsGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    if (
        hasGeneratorExecutedForProject(
            tree,
            options.project,
            'AzureNodeAppInsights',
        )
    )
        return false;

    const { applicationinsightsConnectionString, server } = options;
    const project = getProjects(tree).get(options.project);

    if (!project) {
        throw new Error(
            `No application was found with the name '${options.project}'`,
        );
    }

    const customServerPath = path.join(project.root, server);

    // Check if custom server exist
    if (!tree.exists(customServerPath)) {
        throw new Error('No custom server found.');
    }

    const morphTree = tsMorphTree(tree);
    // Read the Node from the source file
    const customServer = morphTree.addSourceFileAtPath(customServerPath);

    const isAppInsightsImport = customServer
        .getImportDeclarations()
        .some(
            importDeclaration =>
                importDeclaration.getModuleSpecifier().getLiteralValue() ===
                'applicationinsights',
        );

    // Add appInsights to import if it's not there
    if (isAppInsightsImport) {
        throw new Error('AppInsights SDK is already in use.');
    }

    thirdPartyDependencyWarning(['@nx/next:custom-server']);

    customServer.addImportDeclaration({
        namespaceImport: 'appInsights',
        moduleSpecifier: 'applicationinsights',
    });

    const mainFunction = customServer.getFunction('main');

    if (mainFunction) {
        // Add appInisghts statements
        mainFunction.insertStatements(
            0,
            initAppInsights(applicationinsightsConnectionString),
        );
        mainFunction.insertStatements(1, configureAppInsights(options.project));
        mainFunction.insertStatements(2, startAppInsights());

        // Add empty lines after appInisghts statements
        mainFunction.getStatements().forEach(statement => {
            if (statement.getText().includes('appInsights')) {
                statement.appendWhitespace(writer => writer.newLine());
            }
        });
    }

    // Save changes
    customServer.saveSync();

    const serverPath = joinPathFragments(project.root, server);

    // add nx/next custom server to prettier ignore
    addIgnoreEntry(tree, '.prettierignore', 'next server', [serverPath]);
    // Format files excluding the server file
    await formatFiles(tree, [serverPath]);

    console.warn(
        chalk.yellow(
            `${serverPath} has been added to .prettierignore; Amend this file to resolve linting issues.`,
        ),
    );

    // Add dependencies and install
    return runTasksInSerial(updateDependencies(tree));
}
