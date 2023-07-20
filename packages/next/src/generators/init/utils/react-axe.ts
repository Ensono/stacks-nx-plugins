import {
    addDependenciesToPackageJson,
    ProjectConfiguration,
    joinPathFragments,
} from '@nx/devkit';
import { Project, SyntaxKind } from 'ts-morph';

const reactAxeConfigurationCode = `
/**
 * A dynamic import is used here to only load the react-axe library for a11y checks
 * when it is not in production mode
 * This ensures that it is not unnecessarily ran in production.
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production' ) {
    // eslint-disable-next-line global-require
    const axe = require('@axe-core/react'); // eslint-disable-line @typescript-eslint/no-var-requires
    // eslint-disable-next-line global-require
    const React = require('react'); // eslint-disable-line @typescript-eslint/no-var-requires
    // eslint-disable-next-line global-require
    const ReactDOM = require('react-dom'); // eslint-disable-line @typescript-eslint/no-var-requires
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    axe(React, ReactDOM, 1000);
}
`;

export function addReactAxeDependency(tree) {
    return addDependenciesToPackageJson(
        tree,
        {},
        {
            '@axe-core/react': '^4.7.3',
        },
    );
}
/**
 * adds react-axe config to _app.tsx file
 * if the file _app.tsx doesn't exist in the project or is not where it is by convention in nextjs, it will do nothing
 * for projects that use app directory (nextjs v13), this function will not do anything
 * NOTE: In the default configuration of a nextjs v13 app, react-axe will need to be manually configured
 */
export function addReactAxeConfigToApp(
    project: ProjectConfiguration,
    morphTree: Project,
) {
    console.log('TESTTSTTST \n lifuhglwadfkuhlwadif \n skajFDGKWDJFG')
    try {
        const pagesDirectory = joinPathFragments(
            project.root,
            'pages',
            '_app.tsx',
        );
        // Checks if the file _app.tsx exists in the project
        // const isPagesDirectory =
        //     morphTree.getSourceFile(pagesDirectory) !== undefined;

        // if (isPagesDirectory) {
        // the whole operation should fail if the _app.tsx is not found
        const appNode = morphTree.addSourceFileAtPath(pagesDirectory);
        // Find the line containing "function CustomApp"
        const functionCustomAppLine = appNode
            .getDescendantsOfKind(SyntaxKind.FunctionDeclaration)
            .find(node => node.getName() === 'CustomApp')
            ?.getStartLineNumber();

        if (functionCustomAppLine) {
            // Get all the lines in the source file
            const lines = appNode.getFullText().split('\n');

            // Calculate the line number to insert the new code
            const insertLine = functionCustomAppLine - 2;

            // Insert the react-axe config code
            lines.splice(insertLine, 0, reactAxeConfigurationCode);

            // Save the changes to the file.
            appNode.replaceWithText(lines.join('\n'));
            appNode.saveSync();
        }
        // }
    } catch (error) {
        console.error(
            `Couldn't add the react-axe configuration to the project root file, got error: ${error}`,
        );
    }
}
