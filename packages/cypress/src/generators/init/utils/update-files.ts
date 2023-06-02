import { joinPathFragments, Tree, updateJson } from '@nrwl/devkit';

function findOverride(
    json: Array<any>,
    files: Array<string>,
    errorMessage: string,
) {
    return (
        json.find(element =>
            files.every(value => element.files.includes(value)),
        ) ||
        (() => {
            throw new Error(errorMessage);
        })
    );
}

export function updateApplicationLintFile(tree: Tree, path: string) {
    updateJson(tree, joinPathFragments(path, '.eslintrc.json'), eslintjson => {
        const updatedProjectJson = { ...eslintjson };
        const override = findOverride(
            updatedProjectJson.overrides,
            ['*.ts', '*.tsx', '*.js', '*.jsx'],
            'Unable to update the application lint file with with parser options for cypress',
        );
        if (!override.parserOptions) {
            override.parserOptions = {};
        }
        if (!override.parserOptions.project) {
            override.parserOptions.project = [];
        }
        const requiredEntry = joinPathFragments(
            path,
            'cypress',
            'tsconfig(.*)?.json',
        );
        if (!override.parserOptions.project.includes(requiredEntry)) {
            override.parserOptions.project.push(requiredEntry);
        }
        return updatedProjectJson;
    });
}

export function updateTsConfig(tree: Tree, project: string) {
    updateJson(
        tree,
        joinPathFragments(project, 'tsconfig.json'),
        tsConfigJson => {
            const updatedProjectJson = { ...tsConfigJson };
            updatedProjectJson.exclude.push(
                'cypress/**/**',
                'cypress.config.ts',
            );
            updatedProjectJson.references =
                updatedProjectJson.references.filter(
                    reference => reference.path !== './tsconfig.cy.json',
                );
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
