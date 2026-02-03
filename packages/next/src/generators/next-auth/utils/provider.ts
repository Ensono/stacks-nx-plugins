import { tsMorphTree } from '@ensono-stacks/core';
import { generateFiles, joinPathFragments, Tree, logger } from '@nx/devkit';
import { camelCase } from 'change-case';
import path from 'path';
import { SyntaxKind, Project } from 'ts-morph';

function addProviderToMap(provider: string, root: string, morphTree: Project) {
    const providerFile = morphTree.addSourceFileAtPath(
        joinPathFragments(root, 'src', 'providers', 'index.ts'),
    );
    const importName = camelCase(provider);

    providerFile.addImportDeclaration({
        namedImports: [importName],
        moduleSpecifier: `./${provider}`,
    });

    const exportStatement = providerFile
        .getDescendantsOfKind(SyntaxKind.VariableStatement)
        .find(
            d =>
                d.getFirstDescendantByKind(SyntaxKind.Identifier).getText() ===
                'providerMap',
        );
    const providerObject = exportStatement.getFirstDescendantByKind(
        SyntaxKind.ObjectLiteralExpression,
    );
    const propertyAttribute =
        provider === importName ? provider : `'${provider}': ${importName}`;

    providerObject.addProperty(propertyAttribute);

    providerFile.saveSync();
}

export function addProvider(provider: string, root: string, tree: Tree) {
    generateFiles(
        tree,
        path.join(__dirname, '..', 'files', 'providers', provider),
        root,
        {
            template: '',
        },
    );

    const morphTree = tsMorphTree(tree);

    addProviderToMap(provider, root, morphTree);
}
