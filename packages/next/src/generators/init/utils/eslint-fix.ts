import { tsMorphTree } from '@ensono-stacks/core';
import { joinPathFragments, ProjectConfiguration, Tree } from '@nx/devkit';
import { SyntaxKind } from 'ts-morph';

/**
 * Fixes eslint errors from @nrwl/next incompatible with our config.
 */
export function eslintFix(project: ProjectConfiguration, tree: Tree) {
    const morphTree = tsMorphTree(tree);

    // Using exported name 'Index' as identifier for default export  import/no-named-as-default
    const indexSpecNode = morphTree.addSourceFileAtPath(
        joinPathFragments(project.root, 'specs', 'index.spec.tsx'),
    );
    const imports = indexSpecNode.getDescendantsOfKind(
        SyntaxKind.ImportDeclaration,
    );
    const indexImport = imports.find(
        node => node.getModuleSpecifierValue() === '../pages/index',
    );
    if (indexImport) {
        indexImport.removeDefaultImport();
        indexImport.addNamedImport('Index');
        indexSpecNode.saveSync();
    }
}
