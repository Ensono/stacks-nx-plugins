import { joinPathFragments, ProjectConfiguration } from '@nx/devkit';
import { SyntaxKind, Project } from 'ts-morph';

export function addSessionProviderToApp(
    project: ProjectConfiguration,
    morphTree: Project,
) {
    const appNode = morphTree.addSourceFileAtPath(
        joinPathFragments(
            project.root,
            'src',
            'app',
            'api',
            'hello',
            'route.ts',
        ),
    );

    // Check if the App Already contains next-auth
    const isNextAuthImport = appNode
        .getImportDeclarations()
        .some(
            importDeclaration =>
                importDeclaration.getModuleSpecifier().getLiteralValue() ===
                'next-auth',
        );

    if (!isNextAuthImport) {
        appNode.getSourceFile().insertImportDeclaration(0, {
            defaultImport: 'NextAuth',
            moduleSpecifier: 'next-auth',
        });

        // TODO: what does this do
        const content = appNode.getSourceFile();

        const update = content.isKind(SyntaxKind.JsxFragment)
            ? content
                  .getJsxChildren()
                  .map(c => c.getText())
                  .join('')
            : content.getText();

        content.replaceWithText(`${update}`);

        appNode.saveSync();
    }
}
