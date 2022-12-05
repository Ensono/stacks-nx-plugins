import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { FsTree } from 'nx/src/generators/tree';

import { formatFilesWithEslint, nearestEslintConfigPath } from './eslint';

describe('Core: Eslint', () => {
    let tree: Tree;

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });
    describe('formatFilesWithEslint', () => {
        it('formats files using eslint.json', async () => {
            tree.write(
                '.eslintrc.json',
                JSON.stringify({
                    extends: ['plugin:prettier/recommended'],
                    plugins: ['@typescript-eslint', '@nrwl/nx'],
                    parser: '@typescript-eslint/parser',
                }),
            );

            tree.write('test.ts', 'import {test} from "test"\nexport {test}');

            await formatFilesWithEslint(tree);

            const testFile = tree.read('test.ts')?.toString();

            expect(testFile).toEqual(
                `import { test } from 'test';
export { test };
`,
            );
        });

        it('formats files using eslint.js', async () => {
            tree.write(
                '.eslintrc.js',
                `module.exports = ${JSON.stringify({
                    extends: ['plugin:prettier/recommended'],
                    plugins: ['@typescript-eslint', '@nrwl/nx'],
                    parser: '@typescript-eslint/parser',
                })}`,
            );

            tree.write('test.ts', 'import {test} from "test"\nexport {test}');

            await formatFilesWithEslint(tree);

            const testFile = tree.read('test.ts')?.toString();

            expect(testFile).toEqual(
                `import { test } from 'test';
export { test };
`,
            );
        });

        it('formats files without eslint config', async () => {
            tree.write('test.ts', 'import {test} from "test"\nexport {test}');

            await formatFilesWithEslint(tree);

            const testFile = tree.read('test.ts')?.toString();

            expect(testFile).toEqual(
                `import {test} from "test"
export {test}`,
            );
        });

        it('will fallback to prettier with invalid config', async () => {
            const consoleMock = jest.spyOn(console, 'log');
            tree.write(
                '.prettierrc.json',
                JSON.stringify({ semi: true, singleQuote: true }),
            );

            tree.write('.eslintrc.json', 'hello');

            await formatFilesWithEslint(tree);

            expect(consoleMock).toHaveBeenCalledWith(
                expect.stringContaining('prettier'),
            );
        });
    });

    describe('nearestEslintConfigPath', () => {
        it('will find the nearest eslint config in a tree', () => {
            tree.write('.eslintrc.json', '{}');
            tree.write('test/.eslintrc.json', '{}');
            tree.write('test/test.json', '{}');
            tree.write('test2/test.json', '{}');

            const nearestConfigTest = nearestEslintConfigPath(
                tree,
                'test/test.json',
            );
            const nearestConfigTest2 = nearestEslintConfigPath(
                tree,
                'test2/test.json',
            );

            expect(nearestConfigTest).toEqual('test/.eslintrc.json');
            expect(nearestConfigTest2).toEqual('.eslintrc.json');
        });
    });
});
