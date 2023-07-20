import { joinPathFragments, ProjectConfiguration } from '@nx/devkit';
import { SyntaxKind, Project } from 'ts-morph';

import { REACT_QUERY_NPM_PACKAGE_NAME } from './constants';

export function addQueryClientProviderToApp(
    project: ProjectConfiguration,
    morphTree: Project,
) {
    const appNode = morphTree.addSourceFileAtPath(
        joinPathFragments(project.root, 'pages', '_app.tsx'),
    );

    // Check if the App Already contains next-auth
    const isNextAuthImport = appNode
        .getImportDeclarations()
        .some(
            importDeclaration =>
                importDeclaration.getModuleSpecifier().getLiteralValue() ===
                REACT_QUERY_NPM_PACKAGE_NAME,
        );

    if (!isNextAuthImport) {
        appNode.getSourceFile().insertImportDeclaration(0, {
            namedImports: ['QueryClient', 'QueryClientProvider'],
            moduleSpecifier: REACT_QUERY_NPM_PACKAGE_NAME,
        });

        // get default export node reference
        const defaultExport = appNode
            .getExportAssignmentOrThrow(d => !d.isExportEquals())
            .getExpression()
            .getText();
        const main = appNode.getFunction(defaultExport);

        // destruct the session from the pageProps in JSX Component
        const parameter = main.getDescendantsOfKind(
            SyntaxKind.ObjectBindingPattern,
        )[0];

        main.insertStatements(3, ' \nconst queryClient = new QueryClient()\n');

        // Add the QueryClientProvider
        const content = main
            .getDescendantsOfKind(SyntaxKind.ReturnStatement)
            .pop()
            .getFirstChildByKind(SyntaxKind.ParenthesizedExpression)
            .getChildAtIndex(1);

        const update = content.isKind(SyntaxKind.JsxFragment)
            ? content
                  .getJsxChildren()
                  .map(c => c.getText())
                  .join('')
            : content.getText();

        content.replaceWithText(
            `<QueryClientProvider client={queryClient}>
                ${update}
            </QueryClientProvider>`,
        );

        appNode.saveSync();
    }
}
