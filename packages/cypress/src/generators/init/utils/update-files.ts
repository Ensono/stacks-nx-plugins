import { joinPathFragments, Tree, updateJson } from '@nrwl/devkit';

export function updateLintFile(tree: Tree) {
    updateJson(tree, '.eslintrc.json', eslintjson => {
        eslintjson.plugins.push('cypress');
        eslintjson.overrides[1].extends.push('plugin:cypress/recommended');
        return eslintjson;
    });
}

export function updateTsConfig(tree: Tree, project: string) {
    updateJson(
        tree,
        joinPathFragments(project, 'tsconfig.cy.json'),
        tsConfigJson => {
            const updatedProjectJson = { ...tsConfigJson };
            updatedProjectJson.compilerOptions['allowSyntheticDefaultImports'] =
                true;
            return updatedProjectJson;
        },
    );
}

export function updateBaseTsConfig(tree: Tree) {
    // Source map set to false due to Cypress hardcoding inlineSourceMap to true
    updateJson(tree, 'tsconfig.base.json', tsConfigJson => {
        const updatedProjectJson = { ...tsConfigJson };
        updatedProjectJson.compilerOptions['sourceMap'] = false;
        return updatedProjectJson;
    });
}
