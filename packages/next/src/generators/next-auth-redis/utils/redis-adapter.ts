import { tsMorphTree } from '@ensono-stacks/core';
import { joinPathFragments, ProjectConfiguration, Tree } from '@nrwl/devkit';
import { SyntaxKind } from 'ts-morph';

export function configureAdapter(
    project: ProjectConfiguration,
    tree: Tree,
    {
        npmScope,
        libraryName,
        envVar,
    }: {
        npmScope: string;
        libraryName: string;
        envVar: string;
    },
) {
    const morphTree = tsMorphTree(tree);
    const nextAuthNode = morphTree.addSourceFileAtPath(
        joinPathFragments(
            project.root,
            'pages',
            'api',
            'auth',
            '[...nextauth].ts',
        ),
    );

    nextAuthNode.addImportDeclaration({
        namedImports: ['IORedisAdapter'],
        moduleSpecifier: `@${npmScope}/${libraryName}`,
    });
    nextAuthNode.addImportDeclaration({
        namedImports: ['Redis'],
        moduleSpecifier: 'ioredis',
    });

    const callExpression = nextAuthNode
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .find(
            d =>
                d.getFirstChildByKind(SyntaxKind.Identifier).getText() ===
                'NextAuth',
        );

    if (!callExpression) {
        throw new Error('Unable to find the NextAuth implementation function.');
    }

    const config = callExpression.getFirstChildByKind(
        SyntaxKind.ObjectLiteralExpression,
    );

    const adapterProperty = config
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .find(
            c =>
                c.getFirstDescendantByKind(SyntaxKind.Identifier)?.getText() ===
                'adapter',
        );

    if (adapterProperty) {
        adapterProperty.remove();
    }
    config.addPropertyAssignment({
        name: 'adapter',
        initializer: `IORedisAdapter(new Redis(process.env.${envVar}))`,
    });

    nextAuthNode.saveSync();
}
