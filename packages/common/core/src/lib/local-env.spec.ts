import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import { createOrUpdateLocalEnv } from '.';

describe('environment', () => {
    let tree: Tree;

    beforeEach(async () => {
        tree = createTreeWithEmptyWorkspace();
    });

    describe('createOrUpdateLocalEnv', () => {
        it("should create the local env file if doesn't exist", () => {
            createOrUpdateLocalEnv({ name: 'test-project', root: '' }, tree, {
                testEnv: 'testValue',
            });

            expect(tree.exists('.env.local')).toBeTruthy();
            expect(tree.read('.env.local', 'utf-8')).toContain(
                'TEST_ENV=testValue',
            );
        });

        it('should update the local env file if exist', () => {
            tree.write('.env.local', 'TEST_ENV=testValue');

            createOrUpdateLocalEnv({ name: 'test-project', root: '' }, tree, {
                newEnv: 'newValue',
            });

            expect(tree.exists('.env.local')).toBeTruthy();
            expect(tree.read('.env.local', 'utf-8')).toContain(
                'TEST_ENV=testValue\nNEW_ENV=newValue',
            );
        });

        it('should not update the value in the env file if defined', () => {
            tree.write('.env.local', 'TEST_ENV=testValue');

            createOrUpdateLocalEnv({ name: 'test-project', root: '' }, tree, {
                testEnv: 'replaceValue',
                newEnv: 'newValue',
            });

            expect(tree.exists('.env.local')).toBeTruthy();
            expect(tree.read('.env.local', 'utf-8')).toContain(
                'TEST_ENV=testValue\nNEW_ENV=newValue',
            );
        });
    });
});
