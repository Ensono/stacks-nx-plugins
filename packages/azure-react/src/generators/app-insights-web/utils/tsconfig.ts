import { updateJson, Tree } from '@nx/devkit';

const updateTsConfig = (tree: Tree, filePath: string) => {
    updateJson(tree, filePath, tsconfig => {
        const update = tsconfig;

        const compiler: any = {
            composite: true,
            declaration: true,
        };

        update.compilerOptions = {
            ...update.compilerOptions,
            ...compiler,
        };

        update.include = [...new Set([...(update.include || []), '**/*.tsx'])];

        return update;
    });
};

export default updateTsConfig;
