import { joinPathFragments, ProjectConfiguration } from '@nx/devkit';
import { SyntaxKind, Project } from 'ts-morph';

export function addSessionProviderToApp(
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
                'next-auth/react',
        );

    if (!isNextAuthImport) {
        appNode.getSourceFile().insertImportDeclaration(0, {
            namedImports: ['SessionProvider'],
            moduleSpecifier: 'next-auth/react',
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

        const pageProperties = parameter
            .getDescendantsOfKind(SyntaxKind.BindingElement)
            .find(d => d.getText().startsWith('pageProps'));

        if (!pageProperties) {
            parameter.replaceWithText(
                '{ Component, pageProps: { session, ...pageProps } }',
            );
        } else if (pageProperties.getText() === 'pageProps') {
            pageProperties.replaceWithText(
                'pageProps: { session, ...pageProps }',
            );
        } else {
            const destructered = pageProperties
                .getDescendantsOfKind(SyntaxKind.BindingElement)
                .map(d => d.getText())
                .join(', ');
            pageProperties
                .getFirstChildByKind(SyntaxKind.ObjectBindingPattern)
                .replaceWithText(`{ session, ${destructered} }`);
        }

        // Add the SessionProvider
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
            `<SessionProvider session={session}>
${update}
</SessionProvider>`,
        );

        appNode.saveSync();
    }
}
