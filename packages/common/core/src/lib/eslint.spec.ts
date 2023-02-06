import { Tree, readJson, writeJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import { updateEslintConfig, mergeEslintConfigs } from './common-core';

const base = {
    extends: ['test'],
    plugins: ['some-plugin'],
    rules: {
        'some-rule': 'off',
    },
};

const replaceConfig = {
    extends: ['hello'],
};

const replaceObject = `module.exports = {
  extends: [
    "hello",
  ],
};`;

describe('Core: Array', () => {
    let appTree: Tree;

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
    });
    describe('updateEslintConfig', () => {
        it('should replace content of eslintrc.json file', () => {
            writeJson(appTree, 'test/.eslintrc.json', base);

            updateEslintConfig(appTree, 'test', () => replaceConfig);

            expect(readJson(appTree, 'test/.eslintrc.json')).toMatchObject(
                replaceConfig,
            );
        });

        it('should replace content of eslintrc.js file', () => {
            appTree.write(
                'test/.eslintrc.js',
                `module.exports = ${JSON.stringify(base)};`,
            );

            updateEslintConfig(appTree, 'test', () => replaceConfig);

            expect(appTree.read('test/.eslintrc.js')?.toString()).toEqual(
                replaceObject,
            );
        });

        it('should write an eslint.json file if no eslintrc exists', () => {
            updateEslintConfig(appTree, 'test', () => replaceConfig);

            expect(readJson(appTree, 'test/.eslintrc.json')).toMatchObject(
                replaceConfig,
            );
        });

        it('should create a valid blank config if nothing supplied', () => {
            updateEslintConfig(appTree, 'test', () => ({}));

            expect(readJson(appTree, 'test/.eslintrc.json')).toMatchObject({});
        });
    });

    describe('mergeEslintConfigs', () => {
        it('returns the config with only one argument', () => {
            const config = {
                extends: ['test'],
            };
            const update = mergeEslintConfigs(config);

            expect(update).toMatchObject(config);
        });

        it('returns an empty config with no arguments', () => {
            const update = mergeEslintConfigs();

            expect(update).toMatchObject({});
        });

        it('returns a config with multiple arguments', () => {
            const update = mergeEslintConfigs(
                {
                    extends: ['extend'],
                },
                {
                    plugins: ['plugin'],
                },
                {
                    settings: { key: 'value' },
                },
                {
                    rules: {
                        rule: 'off',
                    },
                },
                {
                    overrides: [
                        {
                            files: '*.ts',
                            rules: { rule: 'off' },
                            parserOptions: { project: ['./tsconfig.json'] },
                        },
                    ],
                },
            );

            expect(update).toMatchObject({
                extends: ['extend'],
                plugins: ['plugin'],
                settings: { key: 'value' },
                rules: {
                    rule: 'off',
                },
                overrides: [
                    {
                        files: '*.ts',
                        rules: { rule: 'off' },
                        parserOptions: { project: ['./tsconfig.json'] },
                    },
                ],
            });
        });

        it('merges overrides that match by files', () => {
            const update = mergeEslintConfigs(
                {
                    overrides: [
                        {
                            files: '*.ts',
                            rules: { rule: 'off' },
                        },
                    ],
                },
                {
                    overrides: [
                        {
                            files: '*.ts',
                            rules: { another: 'off' },
                        },
                    ],
                },
            );

            expect(update).toMatchObject({
                overrides: [
                    {
                        files: '*.ts',
                        rules: { another: 'off', rule: 'off' },
                    },
                ],
            });
        });

        it('merges overrides that match by files with complex shapes', () => {
            const update = mergeEslintConfigs(
                {
                    overrides: [
                        {
                            files: ['test/*.tsx', '*.ts', 'test/*.ts'],
                            plugins: ['plugin'],
                            rules: { rule: 'off' },
                            parserOptions: {
                                project: ['./tsconfig.json'],
                            },
                        },
                    ],
                },
                {
                    overrides: [
                        {
                            files: ['*.ts', 'test/*.ts', 'test/*.tsx'],
                            extends: ['test'],
                            plugins: ['test'],
                            rules: { another: 'off' },
                            parserOptions: {
                                programs: ['./someOtherConfig.json'],
                            },
                        },
                    ],
                },
            );

            expect(update).toMatchObject({
                overrides: [
                    {
                        files: ['test/*.tsx', '*.ts', 'test/*.ts'],
                        extends: ['test'],
                        plugins: ['plugin', 'test'],
                        rules: { another: 'off', rule: 'off' },
                        parserOptions: {
                            project: ['./tsconfig.json'],
                            programs: ['./someOtherConfig.json'],
                        },
                    },
                ],
            });
        });

        it('merges unique overrides', () => {
            const update = mergeEslintConfigs(
                {
                    overrides: [
                        {
                            files: '*.ts',
                            rules: { rule: 'off' },
                        },
                    ],
                },
                {
                    overrides: [
                        {
                            files: '*.tsx',
                            rules: { another: 'off' },
                        },
                    ],
                },
            );

            expect(update).toMatchObject({
                overrides: [
                    {
                        files: '*.ts',
                        rules: { rule: 'off' },
                    },
                    {
                        files: '*.tsx',
                        rules: { another: 'off' },
                    },
                ],
            });
        });
    });
});
