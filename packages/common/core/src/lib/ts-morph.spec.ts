import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Project, SyntaxKind } from 'ts-morph';

import { readJsonInJs, updateJsonInJS, tsMorphTree } from './common-core';

const helloWorld = `module.exports = {
  hello: "world",
};`;

describe('Core: TsMorph', () => {
    let appTree: Tree;
    let project: Project;

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        project = tsMorphTree(appTree);
    });

    describe('TreeFileSystem', () => {
        it('can create files to the tree', async () => {
            const content = 'export default "hello";';
            appTree.write('test.ts', '');
            const source = project.addSourceFileAtPath('test.ts');
            source.replaceWithText(content);
            await source.save();

            expect(appTree.exists('test.ts')).toBeTruthy();
            expect(appTree.read('test.ts')?.toString()).toEqual(content);
        });

        it('can delete files from the tree', async () => {
            const content = 'export default "hello";';
            appTree.write('test.ts', content);
            const source = project.addSourceFileAtPath('test.ts');
            source.delete();
            await project.save();

            expect(appTree.exists('test.ts')).toBeFalsy();
        });

        it('throws an error if file does not exist', () => {
            expect(() => project.addSourceFileAtPath('test.ts')).toThrowError(
                'File at path /test.ts does not exist',
            );
        });
    });

    describe('readJsonInJs', () => {
        it('can return a JSON object from a literal expression', () => {
            const input =
                'module.exports = { test: true, key: "value", number: 5 };';
            appTree.write('test.js', input);

            const source = project.addSourceFileAtPath('test.js');
            const expression = source.getDescendantsOfKind(
                SyntaxKind.ObjectLiteralExpression,
            )[0];

            const json = readJsonInJs(expression);

            expect(json).toMatchObject({
                test: true,
                key: 'value',
                number: 5,
            });
        });
    });

    describe('updateJsonInJs', () => {
        it('can update a JSON object from a literal expression', () => {
            const input =
                'module.exports = { test: true, key: "value", number: 5 };';
            appTree.write('test.js', input);

            const source = project.addSourceFileAtPath('test.js');
            const expression = source.getDescendantsOfKind(
                SyntaxKind.ObjectLiteralExpression,
            )[0];

            const update = { hello: 'world' };
            updateJsonInJS(expression, () => update);
            expect(appTree.read('test.js')?.toString()).toEqual(helloWorld);
        });
    });
});
