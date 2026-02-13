import {
    createNextApplication,
    newProject,
    runTarget,
    targetOptions,
    cleanup,
} from '@ensono-stacks/e2e';
import { joinPathFragments } from '@nx/devkit';
import {
    checkFilesExist,
    runNxCommandAsync,
    tmpProjPath,
    readJson,
    readFile,
    uniq,
    updateFile,
} from '@nx/plugin/testing';
import path from 'path';
import { Project, SourceFile } from 'ts-morph';

import { addTurbopackAlias } from '../utils/next-config';

describe('next e2e', () => {
    process.env.HUSKY = '0';
    const project = uniq('nextjs');

    beforeAll(async () => {
        await newProject(['@ensono-stacks/next'], ['@nx/next', '@nx/react']);
        await createNextApplication(project);

        // Add module resolutions to nextjs webpack config to allow for mocking of imports
        addTurbopackAlias(tmpProjPath(path.join('apps', project)), {
            ioredis: 'ioredis-mock',
        });
    }, 1000000);

    afterAll(async () => {
        cleanup();
    });

    describe('init generator', () => {
        it('runs the install generator', async () => {
            expect(() =>
                checkFilesExist(
                    'tsconfig.base.json',
                    'eslint.config.mjs',
                    path.join('apps', project, 'Dockerfile'),
                    path.join('apps', project, 'eslint.config.mjs'),
                ),
            ).not.toThrow();
        });

        it('generates flat eslint config files', () => {
            const rootEslintConfig = readFile('eslint.config.mjs');

            expect(rootEslintConfig).toContain('typescript-eslint');
            expect(rootEslintConfig).toContain('eslint-plugin-security');

            const projectEslintConfig = readFile(
                path.join('apps', project, 'eslint.config.mjs'),
            );

            expect(projectEslintConfig).toContain('@next/eslint-plugin-next');
            expect(projectEslintConfig).toContain(
                'eslint-plugin-testing-library',
            );
        });

        it('serves the application', async () => {
            expect(await runTarget(project, targetOptions.start)).toBeTruthy();
        });

        describe('it lints the application', () => {
            let sourceFile: SourceFile;
            let original: string;

            beforeAll(() => {
                sourceFile = new Project().addSourceFileAtPath(
                    joinPathFragments(
                        tmpProjPath(),
                        'apps',
                        project,
                        'src',
                        'app',
                        'page.tsx',
                    ),
                );
                original = sourceFile.getFullText();
            });

            it('should have no linting errors', async () => {
                expect(
                    await runTarget(project, targetOptions.lint),
                ).toBeTruthy();
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
    });

    describe('NextAuth generator', () => {
        let config: string;

        beforeAll(async () => {
            config = readFile(path.join('apps', project, 'tsconfig.json'));
            await runNxCommandAsync(
                `generate @ensono-stacks/next:next-auth --name=no-provider --project=${project} --directory=libs/no-provider --provider=none --sessionStorage=cookie --guestSession=false --no-interactive`,
            );
        });

        afterAll(async () => {
            updateFile(path.join('apps', project, 'tsconfig.json'), config);
        });

        it('adds new files for NextAuth', () => {
            expect(() =>
                checkFilesExist(
                    path.join(
                        'apps',
                        project,
                        'src',
                        'app',
                        'api',
                        'auth',
                        '[...nextauth]',
                        'route.ts',
                    ),
                    path.join('apps', project, '.env.local'),
                    path.join('libs', 'no-provider', 'src', 'index.ts'),
                ),
            ).not.toThrow();
        });

        it('can serve the application', async () => {
            await runNxCommandAsync('reset');
            expect(await runTarget(project, targetOptions.start)).toBeTruthy();
        });
    });

    describe('MS Entra ID NextAuth generator', () => {
        let config: string;

        beforeAll(async () => {
            config = readFile(path.join('apps', project, 'tsconfig.json'));
            await runNxCommandAsync(
                `generate @ensono-stacks/next:next-auth --name=ms-entra-id --project=${project} --directory=libs/ms-entra-id --provider=microsoft-entra-id --sessionStorage=cookie --guestSession=true --no-interactive`,
            );
        });

        afterAll(async () => {
            updateFile(path.join('apps', project, 'tsconfig.json'), config);
            await runNxCommandAsync('reset');
        });

        it('adds new files for NextAuth', () => {
            expect(() =>
                checkFilesExist(
                    path.join(
                        'apps',
                        project,
                        'src',
                        'app',
                        'api',
                        'auth',
                        '[...nextauth]',
                        'route.ts',
                    ),
                    path.join('apps', project, '.env.local'),
                    path.join('libs', 'ms-entra-id', 'src', 'index.ts'),
                    path.join(
                        'libs',
                        'ms-entra-id',
                        'src',
                        'providers',
                        'microsoft-entra-id.ts',
                    ),
                    path.join(
                        'libs',
                        'ms-entra-id',
                        'src',
                        'providers',
                        'guest.ts',
                    ),
                ),
            ).not.toThrow();
        });

        it('can serve the application', async () => {
            await runNxCommandAsync('reset');
            expect(await runTarget(project, targetOptions.start)).toBeTruthy();
        });
    });

    describe('Auth0 NextAuth generator', () => {
        //We want the last set of provider tests to not cleanup so the following tests can still build with next-auth
        // let config: string;
        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/next:next-auth --name=auth0 --project=${project} --directory=libs/auth0 --provider=auth0 --sessionStorage=redis --guestSession=true --no-interactive`,
            );
        });

        afterAll(async () => {
            await runNxCommandAsync('reset');
        });

        it('adds new files for NextAuth', () => {
            expect(() =>
                checkFilesExist(
                    path.join(
                        'apps',
                        project,
                        'src',
                        'app',
                        'api',
                        'auth',
                        '[...nextauth]',
                        'route.ts',
                    ),
                    path.join('apps', project, '.env.local'),
                    path.join('libs', 'auth0', 'src', 'index.ts'),
                    path.join('libs', 'auth0', 'src', 'providers', 'auth0.ts'),
                    path.join('libs', 'auth0', 'src', 'providers', 'guest.ts'),
                ),
            ).not.toThrow();
        });

        it('can serve the application', async () => {
            expect(await runTarget(project, targetOptions.start)).toBeTruthy();
        });
    });

    describe('react-query generator', () => {
        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/next:react-query --project=${project} --no-interactive`,
            );
        });

        afterAll(async () => {
            await runNxCommandAsync('reset');
        });

        it('successfully lint with new linting update', async () => {
            expect(await runTarget(project, targetOptions.lint)).toContain(
                `Successfully ran target lint for project ${project}`,
            );
        });

        it('can serve the application', async () => {
            expect(await runTarget(project, targetOptions.start)).toBeTruthy();
        });
    });

    describe('storybook generator', () => {
        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/next:storybook --project=${project} --no-interactive`,
            );
        });

        afterAll(async () => {
            await runNxCommandAsync('reset');
        });

        it('should modify project.json with storybook command', async () => {
            const projectJson = readJson(
                path.join('apps', project, 'project.json'),
            );

            expect(JSON.stringify(projectJson)).toContain('storybook');
        });

        it('should modify tsconfig.json with storybook command', async () => {
            const tsconfigJson = readJson(
                path.join('apps', project, 'tsconfig.json'),
            );

            expect(JSON.stringify(tsconfigJson)).toContain('stories');
        });

        it('should modify eslint.config.mjs with storybook command', async () => {
            const eslintConfig = readFile(
                path.join('apps', project, 'eslint.config.mjs'),
            );

            expect(eslintConfig).toContain('storybook');
        });

        describe('it generates a component using custom command', () => {
            beforeAll(async () => {
                await runNxCommandAsync(
                    `generate @nx/react:component --path=apps/${project}/src/components/testcomponent/testcomponent --no-interactive`,
                );
                await runNxCommandAsync(
                    `generate @nx/react:component-story --project=${project} --componentPath=src/components/testcomponent/testcomponent.tsx --verbose --no-interactive`,
                );
            });

            it('adds new files for Storybook component', () => {
                expect(() =>
                    checkFilesExist(
                        path.join(
                            'apps',
                            project,
                            'src',
                            'components',
                            'testcomponent',
                            'testcomponent.module.css',
                        ),
                        path.join(
                            'apps',
                            project,
                            'src',
                            'components',
                            'testcomponent',
                            'testcomponent.spec.tsx',
                        ),
                        path.join(
                            'apps',
                            project,
                            'src',
                            'components',
                            'testcomponent',
                            'testcomponent.stories.tsx',
                        ),
                        path.join(
                            'apps',
                            project,
                            'src',
                            'components',
                            'testcomponent',
                            'testcomponent.tsx',
                        ),
                    ),
                ).not.toThrow();
            });

            it('can serve the storybook application', async () => {
                expect(
                    await runTarget(
                        `${project}:storybook`,
                        targetOptions.storybook,
                        'Storybook 8.1.1 for nextjs started',
                    ),
                ).toBeTruthy();
            });
        });
    });
});
