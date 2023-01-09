import { readJsonInJS } from '@ensono-stacks/core';
import { Tree, readJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { NextGeneratorSchema } from './schema';

jest.mock('@nrwl/devkit', () => ({
    ...jest.requireActual('@nrwl/devkit'),
    getProjects: () => ({
        get: jest.fn(() => ({
            name: 'test',
            sourceRoot: 'test',
        })),
    }),
}));

describe('next install generator', () => {
    let appTree: Tree;
    const options: NextGeneratorSchema = { project: 'test' };

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
    });

    describe('eslint', () => {
        it('should install and configure react specific eslint', async () => {
            await generator(appTree, {
                ...options,
            });

            const packageJson = readJson(appTree, 'package.json');

            expect(Object.keys(packageJson.devDependencies)).toEqual(
                expect.arrayContaining(['testing-library/react']),
            );
        });

        it('should merge defaults with an existing eslintrc.json file', async () => {
            const defaultConfig = {
                plugins: ['@nrwl/nx'],
                overrides: [
                    {
                        files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                        extends: ['airbnb-base'],
                        plugins: ['@nrwl/nx'],
                        rules: {
                            'dot-notation': 'off',
                        },
                    },
                ],
            };

            appTree.write('test/.eslintrc.json', JSON.stringify(defaultConfig));

            await generator(appTree, {
                ...options,
            });

            const rootConfig = readJson(appTree, 'test/.eslintrc.json');

            expect(rootConfig).toMatchObject(
                expect.objectContaining({
                    plugins: ['@nrwl/nx'],
                    extends: expect.arrayContaining([
                        'plugin:@nrwl/nx/react-typescript',
                        'plugin:testing-library/react',
                        'plugin:@next/next/recommended',
                        'next/core-web-vitals',
                        '../../.eslintrc.js',
                    ]),
                    overrides: expect.arrayContaining([
                        expect.objectContaining({
                            files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                            rules: expect.objectContaining({
                                'testing-library/await-async-utils': 'error',
                                'testing-library/await-async-query': 'error',
                                'testing-library/no-wait-for-side-effects':
                                    'error',
                                'testing-library/no-manual-cleanup': 'error',
                                'testing-library/prefer-explicit-assert':
                                    'warn',
                                'testing-library/prefer-presence-queries':
                                    'warn',
                                'testing-library/prefer-wait-for': 'error',
                                'testing-library/prefer-user-event': 'warn',
                                'testing-library/no-debug': 'off',
                            }),
                        }),
                    ]),
                }),
            );
        });

        it('should merge defaults with an existing eslintrc.js file', async () => {
            const defaultConfig = {
                plugins: ['@nrwl/nx'],
            };

            appTree.write(
                'test/.eslintrc.js',
                `module.exports = ${JSON.stringify(defaultConfig)};`,
            );

            await generator(appTree, { ...options });

            const rootConfig = readJsonInJS(
                appTree,
                'test/.eslintrc.js',
                'BinaryExpression > ObjectLiteralExpression',
            );
            expect(rootConfig).toMatchObject(
                expect.objectContaining({
                    plugins: ['@nrwl/nx'],
                    extends: expect.arrayContaining([
                        'plugin:@nrwl/nx/react-typescript',
                        'plugin:testing-library/react',
                        'plugin:@next/next/recommended',
                        'next/core-web-vitals',
                        '../../.eslintrc.js',
                    ]),
                    overrides: expect.arrayContaining([
                        expect.objectContaining({
                            files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                            rules: expect.objectContaining({
                                'testing-library/await-async-utils': 'error',
                                'testing-library/await-async-query': 'error',
                                'testing-library/no-wait-for-side-effects':
                                    'error',
                                'testing-library/no-manual-cleanup': 'error',
                                'testing-library/prefer-explicit-assert':
                                    'warn',
                                'testing-library/prefer-presence-queries':
                                    'warn',
                                'testing-library/prefer-wait-for': 'error',
                                'testing-library/prefer-user-event': 'warn',
                                'testing-library/no-debug': 'off',
                            }),
                        }),
                    ]),
                }),
            );
        });
    });
});
