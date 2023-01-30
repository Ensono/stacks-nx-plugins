import { Tree, readJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';

import generator from './generator';
import { NextGeneratorSchema } from './schema';

describe('next install generator', () => {
    let appTree: Tree;
    const options: NextGeneratorSchema = { project: 'next-app' };

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        await applicationGenerator(appTree, {
            name: 'next-app',
            style: 'css',
            standaloneConfig: false,
        });
    });

    describe('eslint', () => {
        it('should install and configure react specific eslint', async () => {
            await generator(appTree, options);

            const packageJson = readJson(appTree, 'package.json');

            expect(Object.keys(packageJson.devDependencies)).toEqual(
                expect.arrayContaining(['eslint-plugin-testing-library']),
            );
        });

        it('should throw if project is not defined', async () => {
            await expect(
                generator(appTree, {
                    ...options,
                    project: 'unknown',
                }),
            ).rejects.toThrowError(
                'Cannot find the unknown project. Please double check the project name.',
            );
        });

        it('should merge defaults with an existing eslintrc.json file', async () => {
            const defaultConfig = {
                plugins: ['@nrwl/nx'],
                overrides: [
                    {
                        files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                        extends: ['airbnb/base'],
                        plugins: ['@nrwl/nx'],
                        rules: {
                            'dot-notation': 'off',
                        },
                    },
                ],
            };

            appTree.write(
                'next-app/.eslintrc.json',
                JSON.stringify(defaultConfig),
            );

            await generator(appTree, options);

            const rootConfig = readJson(appTree, 'next-app/.eslintrc.json');

            expect(rootConfig).toMatchObject(
                expect.objectContaining({
                    plugins: ['@nrwl/nx'],
                    extends: expect.arrayContaining([
                        'plugin:@nrwl/nx/react-typescript',
                        'plugin:testing-library/react',
                        'plugin:@next/next/recommended',
                        'next/core-web-vitals',
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
