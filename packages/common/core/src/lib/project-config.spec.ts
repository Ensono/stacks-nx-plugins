import { mergeProjectConfigTarget } from '.';

const exampleTestCiConfig = {
    configurations: {
        ci: {
            collectCoverage: true,
            coverageReporters: ['text', 'html'],
            collectCoverageFrom: [
                './**/*.{js,jsx,ts,tsx}',
                './!**/.next/**',
                './!**/*.d.ts',
                './!**/*.config.*',
                './!**/_app.*',
            ],
            codeCoverage: true,
            ci: true,
        },
    },
};

describe('project config', () => {
    describe('mergeProjectConfigTarget', () => {
        it('should merge a target into an existing project config with no existing target', () => {
            const result = mergeProjectConfigTarget(
                {
                    root: '',
                    name: 'testing',
                    sourceRoot: 'apps/testing',
                    projectType: 'application',
                    targets: {},
                },
                exampleTestCiConfig,
                'test',
            );

            expect(result).toMatchObject({
                root: '',
                name: 'testing',
                sourceRoot: 'apps/testing',
                projectType: 'application',
                targets: {
                    test: {
                        configurations: {
                            ci: {
                                collectCoverage: true,
                                coverageReporters: ['text', 'html'],
                                collectCoverageFrom: [
                                    './**/*.{js,jsx,ts,tsx}',
                                    './!**/.next/**',
                                    './!**/*.d.ts',
                                    './!**/*.config.*',
                                    './!**/_app.*',
                                ],
                                codeCoverage: true,
                                ci: true,
                            },
                        },
                    },
                },
            });
        });

        it('should merge a target into an existing project config with no target property', () => {
            const result = mergeProjectConfigTarget(
                {
                    root: '',
                    name: 'testing',
                    sourceRoot: 'apps/testing',
                    projectType: 'application',
                },
                exampleTestCiConfig,
                'test',
            );

            expect(result).toMatchObject({
                root: '',
                name: 'testing',
                sourceRoot: 'apps/testing',
                projectType: 'application',
                targets: {
                    test: {
                        configurations: {
                            ci: {
                                collectCoverage: true,
                                coverageReporters: ['text', 'html'],
                                collectCoverageFrom: [
                                    './**/*.{js,jsx,ts,tsx}',
                                    './!**/.next/**',
                                    './!**/*.d.ts',
                                    './!**/*.config.*',
                                    './!**/_app.*',
                                ],
                                codeCoverage: true,
                                ci: true,
                            },
                        },
                    },
                },
            });
        });

        it('should merge a target into an existing project config with an existing target', () => {
            const result = mergeProjectConfigTarget(
                {
                    root: '',
                    name: 'testing',
                    sourceRoot: 'apps/testing',
                    projectType: 'application',
                    targets: {
                        test: {
                            executor: '@nrwl/jest:jest',
                            outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
                            options: {
                                jestConfig: 'apps/testing/jest.config.ts',
                                passWithNoTests: true,
                            },
                            configurations: {
                                ci: {
                                    ci: true,
                                    codeCoverage: true,
                                },
                            },
                        },
                    },
                },
                exampleTestCiConfig,
                'test',
            );

            expect(result).toMatchObject({
                root: '',
                name: 'testing',
                sourceRoot: 'apps/testing',
                projectType: 'application',
                targets: {
                    test: {
                        configurations: {
                            ci: {
                                collectCoverage: true,
                                coverageReporters: ['text', 'html'],
                                collectCoverageFrom: [
                                    './**/*.{js,jsx,ts,tsx}',
                                    './!**/.next/**',
                                    './!**/*.d.ts',
                                    './!**/*.config.*',
                                    './!**/_app.*',
                                ],
                                codeCoverage: true,
                                ci: true,
                            },
                        },
                    },
                },
            });
        });

        it('should overwrite a property if it already exists in a target', () => {
            const result = mergeProjectConfigTarget(
                {
                    root: '',
                    targets: {
                        export: {
                            executor: '@nrwl/next:export',
                            options: {
                                buildTarget: 'next-project:build:production',
                            },
                        },
                    },
                },
                {
                    options: {
                        buildTarget: 'next-project:build:development',
                    },
                },
                'export',
            );

            expect(result).toMatchObject({
                root: '',
                targets: {
                    export: {
                        executor: '@nrwl/next:export',
                        options: {
                            buildTarget: 'next-project:build:development',
                        },
                    },
                },
            });
        });

        it('should merge a nested array', () => {
            const result = mergeProjectConfigTarget(
                {
                    root: '',
                    targets: {
                        test: {
                            configurations: {
                                ci: {
                                    collectCoverage: true,
                                    coverageReporters: ['text', 'html'],
                                    collectCoverageFrom: [
                                        './**/*.{js,jsx,ts,tsx}',
                                    ],
                                    codeCoverage: true,
                                    ci: true,
                                },
                            },
                        },
                    },
                },
                {
                    configurations: {
                        ci: {
                            collectCoverage: true,
                            coverageReporters: ['text', 'html'],
                            collectCoverageFrom: [
                                './!**/.next/**',
                                './!**/*.d.ts',
                                './!**/*.config.*',
                                './!**/_app.*',
                            ],
                            codeCoverage: true,
                            ci: true,
                        },
                    },
                },
                'test',
            );

            expect(result).toMatchObject({
                root: '',
                targets: {
                    test: {
                        configurations: {
                            ci: {
                                collectCoverage: true,
                                coverageReporters: ['text', 'html'],
                                collectCoverageFrom: [
                                    './**/*.{js,jsx,ts,tsx}',
                                    './!**/.next/**',
                                    './!**/*.d.ts',
                                    './!**/*.config.*',
                                    './!**/_app.*',
                                ],
                                codeCoverage: true,
                                ci: true,
                            },
                        },
                    },
                },
            });
        });

        it('should merge a nested array if it doesnt exist in source', () => {
            const result = mergeProjectConfigTarget(
                {
                    root: '',
                    targets: {
                        test: {
                            configurations: {
                                ci: {
                                    collectCoverage: true,
                                    coverageReporters: ['text', 'html'],
                                    codeCoverage: true,
                                    ci: true,
                                },
                            },
                        },
                    },
                },
                {
                    configurations: {
                        ci: {
                            collectCoverage: true,
                            coverageReporters: ['text', 'html'],
                            collectCoverageFrom: [
                                './!**/.next/**',
                                './!**/*.d.ts',
                                './!**/*.config.*',
                                './!**/_app.*',
                            ],
                            codeCoverage: true,
                            ci: true,
                        },
                    },
                },
                'test',
            );

            expect(result).toMatchObject({
                root: '',
                targets: {
                    test: {
                        configurations: {
                            ci: {
                                collectCoverage: true,
                                coverageReporters: ['text', 'html'],
                                collectCoverageFrom: [
                                    './!**/.next/**',
                                    './!**/*.d.ts',
                                    './!**/*.config.*',
                                    './!**/_app.*',
                                ],
                                codeCoverage: true,
                                ci: true,
                            },
                        },
                    },
                },
            });
        });
    });
});
