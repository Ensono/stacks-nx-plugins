import { tsMorphTree, getNpmScope } from '@ensono-stacks/core';
import { joinPathFragments, ProjectConfiguration, Tree } from '@nx/devkit';
import { SyntaxKind, WriterFunction } from 'ts-morph';

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
        joinPathFragments(project.root, 'src', 'auth.ts'),
    );
    const IORedisAdapterImport = nextAuthNode
        .getImportDeclarations()
        .find(
            importDeclaration =>
                importDeclaration.getModuleSpecifier().getLiteralValue() ===
                `@ensono-stacks/${libraryName}`,
        );
    IORedisAdapterImport?.setIsTypeOnly(false);

    if (
        !IORedisAdapterImport?.getNamedImports()?.some(
            modules => modules.getName() === 'IORedisAdapter',
        )
    ) {
        nextAuthNode.addImportDeclaration({
            namedImports: ['IORedisAdapter'],
            moduleSpecifier: `${npmScope}/${libraryName}`,
        });
    }

    const RedisImport = nextAuthNode
        .getImportDeclarations()
        .find(
            importDeclaration =>
                importDeclaration.getModuleSpecifier().getLiteralValue() ===
                'ioredis',
        );
    RedisImport?.setIsTypeOnly(false);

    if (
        !RedisImport?.getNamedImports()?.some(
            modules => modules.getName() === 'Redis',
        )
    ) {
        nextAuthNode.addImportDeclaration({
            namedImports: ['Redis'],
            moduleSpecifier: 'ioredis',
        });
    }

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
        initializer: `IORedisAdapter(new Redis(process.env.${envVar} as string))`,
    });

    config.addPropertyAssignment({
        name: 'session',
        initializer: `
        {
            strategy: 'jwt'
        }`,
    });

    nextAuthNode.saveSync();
}
