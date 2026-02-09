import { tsMorphTree } from '@ensono-stacks/core';
import {
    addDependenciesToPackageJson,
    ProjectConfiguration,
    joinPathFragments,
    Tree,
    logger,
    GeneratorCallback,
} from '@nx/devkit';
import { SyntaxKind } from 'ts-morph';

import { REACT_AXE_CORE_VERSION } from '../../../utils/constants';

/**
 * adds react-axe config to _app.tsx file
 * if the file _app.tsx doesn't exist in the project or is not where it is by convention in nextjs, it will do nothing
 * for projects that use app directory (nextjs v13), this function will not do anything
 * NOTE: In the default configuration of a nextjs v13 app, react-axe will need to be manually configured
 */
export function addReactAxeConfigToApp(
    tree: Tree,
    project: ProjectConfiguration,
): GeneratorCallback {
    const morphTree = tsMorphTree(tree);

    try {
        const appDirectory = joinPathFragments(
            project.root,
            'src',
            'app',
            'layout.tsx',
        );
        const appNode = morphTree.addSourceFileAtPath(appDirectory);

        // only try to modify the layout.tsx file if it exists
        if (
            !appNode.getImportDeclaration(d =>
                d
                    .getModuleSpecifier()
                    .getText()
                    .includes('/components/a11y/axe'),
            )
        ) {
            appNode.addImportDeclaration({
                defaultImport: 'Axe',
                moduleSpecifier: '../components/a11y/axe',
            });

            const bodyJsx = appNode
                .getDescendantsOfKind(SyntaxKind.JsxElement)
                .find(
                    d =>
                        d
                            .getFirstDescendantByKind(
                                SyntaxKind.JsxOpeningElement,
                            )
                            ?.getFirstDescendantByKind(SyntaxKind.Identifier)
                            ?.getText() === 'body',
                );

            if (bodyJsx) {
                const bodyExpression = bodyJsx.getFirstDescendantByKind(
                    SyntaxKind.JsxExpression,
                );

                if (bodyExpression) {
                    const update = `<Axe />${bodyExpression.getText()}`;

                    bodyExpression.replaceWithText(update);
                }
            }

            appNode.saveSync();
        }

        return addDependenciesToPackageJson(
            tree,
            {},
            {
                '@axe-core/react': REACT_AXE_CORE_VERSION,
            },
        );
    } catch (error) {
        logger.error(
            `Failed to add the react-axe configuration to the app/layout.tsx file, got error: ${error}`,
        );
        logger.warn(
            `Failed possibly because this next.js application was created with the new app directory which doesn't have an layout.tsx file.`,
        );
    }

    return () => {};
}
