import {
    createNextApplication,
    newProject,
    runTarget,
    targetOptions,
} from '@ensono-stacks/e2e';
import {joinPathFragments} from '@nx/devkit';
import {
    checkFilesExist,
    runNxCommandAsync,
    tmpProjPath,
    readJson,
    uniq,
} from '@nx/plugin/testing';
import { Project } from 'ts-morph';

describe('next e2e', () => {
    jest.setTimeout(1_000_000);
    process.env.HUSKY = '0';
    const project = uniq('nextjs');

    beforeAll(async () => {
        await newProject(['@ensono-stacks/next'], ['@nx/next']);
        await createNextApplication(project);
    });

    afterAll(async () => {
        await runNxCommandAsync('reset');
    });

    describe('init generator', () => {
        it('runs the install generator', async () => {
            expect(() =>
                checkFilesExist('tsconfig.base.json', '.eslintrc.json'),
            ).not.toThrow();
        });

        it('serves the application', async () => {
            expect(await runTarget(project, targetOptions.serve)).toBeTruthy();
        });

        describe('it lints the application', () => {
            let sourceFile, original;

            beforeAll(() => {
                sourceFile = new Project().addSourceFileAtPath(
                    joinPathFragments(
                        tmpProjPath(),
                        'apps',
                        project,
                        'pages',
                        'index.tsx',
                    ),
                );
                original = sourceFile.getFullText();
            });

            it('should have no linting errors', async () => {
                expect(await runTarget(project, targetOptions.lint)).toContain(
                    'All files pass linting',
                );
            });

            it('it should having ally linting errors', async () => {
                sourceFile.insertText(
                    original.indexOf('<div className="text-container">'),
                    '<div role="date">Some Text in a \'div\' with an incorrect aria role</div>\n',
                );
                sourceFile.saveSync();
                expect(await runTarget(project, targetOptions.lint)).toContain(
                    'jsx-a11y/aria-role',
                );
            });

            afterEach(() => {
                sourceFile.replaceWithText(original);
                sourceFile.saveSync();
            });
        });

        describe('adds storybook to the application', () => {
            it('should modify project.json with storybook command', async () => {

                const projectJson = readJson(`${project}/project.json`);

                // toContain(
                expect(projectJson).toEqual(
                    expect.objectContaining({
                        storybook: {
                            executor: '@nx/storybook:storybook',
                            options: {
                                port: 4400,
                                configDir: 'apps/next-app/.storybook',
                            },
                            configurations: {
                                ci: {
                                    quiet: true,
                                },
                            },
                        },
                    }),
                );
            });

            it('should modify nx.json with storybook command', async () => {
                const nxConfigJson = readJson(`${project}/nx.json`);

                expect(nxConfigJson).toEqual(
                    expect.objectContaining({
                        targetDefaults: {
                            'build-storybook': {
                                inputs: [
                                    'default',
                                    '^production',
                                    '{projectRoot}/.storybook/**/*',
                                    '{projectRoot}/tsconfig.storybook.json',
                                ],
                            },
                        },
                    }),
                );
            });

            it('should modify tsconfig.json with storybook command', async () => {
                const tsconfigJson = readJson(`${project}//tsconfig.json`);

                expect(tsconfigJson).toEqual(
                    expect.objectContaining({
                        exclude: [
                            'node_modules',
                            'jest.config.ts',
                            'src/**/*.spec.ts',
                            'src/**/*.test.ts',
                            '**/*.stories.ts',
                            '**/*.stories.js',
                        ],
                        references: [
                            {
                                path: './tsconfig.storybook.json',
                            },
                        ],
                    }),
                );
            });

            it('should modify .eslintrc.json with storybook command', async () => {
                const eslintConfigJson = readJson(`${project}//.eslintrc.json`);

                expect(eslintConfigJson).toEqual(
                    expect.objectContaining({
                        overrides: [
                            {
                                parserOptions: {
                                    project: [
                                        'apps/demo/tsconfig(.*)?.json',
                                        'apps/demo/tsconfig.storybook.json',
                                    ],
                                },
                            },
                        ],
                    }),
                );
            });
        });
    });

    describe('NextAuth generator', () => {
        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/next:next-auth --project=${project} --provider=azureAd --no-interactive`,
            );
        });

        it('adds new files for NextAuth', () => {
            expect(() =>
                checkFilesExist(
                    `apps/${project}/pages/api/auth/[...nextauth].ts`,
                    `apps/${project}/.env.local`,
                ),
            ).not.toThrow();
        });

        it('can serve the application', async () => {
            expect(await runTarget(project, targetOptions.serve)).toBeTruthy();
        });
    });

    describe('init-deployment generator', () => {
        const library = 'stacks-helm-chart';
        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/next:init-deployment --project=${project} --libraryName=${library} --no-interactive`,
            );
        });

        it('creates the required helm chart library', async () => {
            const libraryPath = joinPathFragments('libs', library);
            expect(() =>
                checkFilesExist(
                    joinPathFragments(libraryPath, 'project.json'),
                    joinPathFragments(
                        libraryPath,
                        'build',
                        'helm',
                        'Chart.yaml',
                    ),
                ),
            ).not.toThrow();
        });

        it('is a usable package and can be linted', async () => {
            expect(await runTarget(library, targetOptions.lint)).toContain(
                '1 chart(s) linted, 0 chart(s) failed',
            );
        });
    });

    describe('react-query generator', () => {
        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/next:react-query --project=${project} --no-interactive`,
            );
        });

        it('successfully lint with new linting update', async () => {
            expect(await runTarget(project, targetOptions.lint)).toContain(
                `Successfully ran target lint for project ${project}`,
            );
        });

        it('can serve the application', async () => {
            expect(await runTarget(project, targetOptions.serve)).toBeTruthy();
        });
    });

});
