import {
    addIgnoreEntry,
    formatFiles,
    thirdPartyDependancyWarning,
} from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    getProjects,
    joinPathFragments,
    Tree,
} from '@nrwl/devkit';
import chalk from 'chalk';
import path from 'path';
import { Project, ScriptTarget } from 'ts-morph';

import {
    initAppInsights,
    configureAppInsights,
    startAppInsights,
} from '../../../templates/appInsights';
import { appInsightsVersion } from '../../../utils/versions';
import { AppInsightsGeneratorSchema } from './schema';

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
    const { appInsightsKey, server } = options;
    const project = getProjects(tree).get(options.project);

    if (!project) {
        throw new Error(
            `No application was found with the name '${options.project}'`,
        );
    }

    const customServerPath = path.join(project.sourceRoot, server);

    // Check if custom server exist
    if (!tree.exists(customServerPath)) {
        throw new Error('No custom server found.');
    }

    const tsMorphProject = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: { target: ScriptTarget.ESNext },
    });

    // Read the existing server file into tsMorphProject
    const customServerContents = tree.read(customServerPath).toString();
    tsMorphProject.createSourceFile(customServerPath, customServerContents);

    // Read the Node from the source file
    const customServer = tsMorphProject.getSourceFile(customServerPath);

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

    thirdPartyDependancyWarning(['@nrwl/next:custom-server']);

    customServer.addImportDeclaration({
        namespaceImport: 'appInsights',
        moduleSpecifier: 'applicationinsights',
    });

    const mainFunction = customServer.getFunction('main');

    // Add appInisghts statements
    mainFunction.insertStatements(0, initAppInsights(appInsightsKey));
    mainFunction.insertStatements(1, configureAppInsights(project.name));
    mainFunction.insertStatements(2, startAppInsights());

    // Add empty lines after appInisghts statements
    mainFunction.getStatements().forEach(statement => {
        if (statement.getText().includes('appInsights')) {
            statement.appendWhitespace(writer => writer.newLine());
        }
    });

    // Write changes back to the tree
    tree.write(
        customServerPath,
        tsMorphProject.getSourceFile(customServerPath).getText(),
    );

    const serverPath = joinPathFragments(project.root, server);
    // add nrwl/next custom server to prettier ignore
    addIgnoreEntry(tree, '.prettierignore', 'next server', [`${serverPath}`]);
    // Format files excluding the server file
    await formatFiles(tree, [`${serverPath}`]);

    console.warn(
        chalk.yellow`${serverPath} has been added to .prettierignore; Amend this file and resolve linting issues.`,
    );

    // Add dependencies and install
    return updateDependencies(tree);
}
