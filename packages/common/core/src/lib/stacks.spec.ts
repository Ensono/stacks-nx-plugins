import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import { readStacksConfig, readStacksExecutedGenerators, StacksError } from '.';
import { testInitStacksConfig } from '../test';

describe('stacks', () => {
    let tree: Tree;

    beforeEach(async () => {
        tree = createTreeWithEmptyWorkspace();
    });

    describe('readStacksConfig', () => {
        it('should read the stacks config from nx.json', () => {
            const { stacksConfig } = testInitStacksConfig(tree, 'testProject');

            const result = readStacksConfig(tree);

            expect(result).toMatchObject(stacksConfig);
        });

        it('should throw an error if stacks key is missing', () => {
            // eslint-disable-next-line unicorn/consistent-function-scoping
            const result = () => readStacksConfig(tree);

            expect(result).toThrow(StacksError);
            expect(result).toThrow(
                'Stacks configuration is not set. Please update nx.json.',
            );
        });

        it('should throw an error if stacks config is incomplete', () => {
            tree.write('nx.json', JSON.stringify({ stacks: { config: {} } }));

            const result = () => readStacksConfig(tree);

            expect(result).toThrow(StacksError);
            expect(result).toThrow(
                'Incomplete Stacks configuration in nx.json.',
            );
        });
    });

    describe('readStacksExecutedGenerators', () => {
        it('should read the stacks executedGenerators from nx.json', () => {
            const { stacksExecutedGenerators } = testInitStacksConfig(
                tree,
                'testProject',
            );

            const result = readStacksExecutedGenerators(tree);

            expect(result).toMatchObject(stacksExecutedGenerators);
        });

        it('should throw an error if stacks key is missing', () => {
            // eslint-disable-next-line unicorn/consistent-function-scoping
            const result = () => readStacksExecutedGenerators(tree);

            expect(result).toThrow(StacksError);
            expect(result).toThrow(
                'Stacks configuration is not set. Please update nx.json.',
            );
        });

        it('should throw an error if stacks executedGenerator is missing', () => {
            tree.write('nx.json', JSON.stringify({ stacks: {} }));

            const result = () => readStacksExecutedGenerators(tree);

            expect(result).toThrow(StacksError);
            expect(result).toThrow(
                'Incomplete Stacks configuration in nx.json. Missing `executedGenerators` attribute.',
            );
        });
    });
});
