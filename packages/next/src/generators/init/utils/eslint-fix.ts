import { tsMorphTree } from '@ensono-stacks/core';
import { joinPathFragments, ProjectConfiguration, Tree } from '@nrwl/devkit';
import { SyntaxKind } from 'ts-morph';

/**
 * Fixes eslint errors from @nrwl/next incompatible with our config.
 */
export function eslintFix(project: ProjectConfiguration, tree: Tree) {
    const morphTree = tsMorphTree(tree);

    // Specify the rules you want to disable  unicorn/no-abusive-eslint-disable
    const jestConfigNode = morphTree.addSourceFileAtPath(
        joinPathFragments(project.root, 'jest.config.ts'),
    );
    jestConfigNode
        .getStatementsWithComments()
        .find(node => node.getText() === '/* eslint-disable */')
        ?.remove();
    jestConfigNode.saveSync();

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
