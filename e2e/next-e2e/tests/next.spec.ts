import {
    createNextApplication,
    newProject,
    runTarget,
    targetOptions,
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
import { Project } from 'ts-morph';

import { addWebpackAlias } from '../utils/next-config';
import path from 'path';

describe('next e2e', () => {
    jest.setTimeout(1_000_000);
    process.env.HUSKY = '0';
    const project = uniq('nextjs');

    beforeAll(async () => {
        await newProject(['@ensono-stacks/next'], ['@nx/next']);
        await createNextApplication(project);

        // Add module resolutions to nextjs webpack config to allow for mocking of imports
        addWebpackAlias(tmpProjPath(path.join('apps', project)), {
            ioredis$: 'ioredis-mock',
        });
    });

    afterAll(async () => {
        await runNxCommandAsync('reset');
    });

    describe('init generator', () => {
        it('runs the install generator', async () => {
            expect(() =>
                checkFilesExist(
                    'tsconfig.base.json',
                    '.eslintrc.json',
                    path.join('apps', project, 'Dockerfile'),
                ),
            ).not.toThrow();
        });

        it('serves the application', async () => {
            expect(await runTarget(project, targetOptions.start)).toBeTruthy();
        });

        describe('it lints the application', () => {
            let sourceFile, original;

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
            config = readFile(`apps/${project}/tsconfig.json`);
            await runNxCommandAsync(
                `generate @ensono-stacks/next:next-auth --name=no-provider --project=${project} --provider=none --sessionStorage=cookie --guestSession=false --no-interactive`,
            );
        });

        afterAll(async () => {
            updateFile(`apps/${project}/tsconfig.json`, config);
            await runNxCommandAsync('reset');
        });

        it('adds new files for NextAuth', () => {
            expect(() =>
                checkFilesExist(
                    `apps/${project}/src/app/api/auth/[...nextauth]/route.ts`,
                    `apps/${project}/.env.local`,
                    `libs/no-provider/src/index.ts`,
                ),
            ).not.toThrow();
        });

        it('can serve the application', async () => {
            expect(await runTarget(project, targetOptions.start)).toBeTruthy();
        });
    });

    describe('MS Entra ID NextAuth generator', () => {
        let config: string;
        beforeAll(async () => {
            config = readFile(`apps/${project}/tsconfig.json`);
            await runNxCommandAsync(
                `generate @ensono-stacks/next:next-auth --name=ms-entra-id --project=${project} --provider=microsoft-entra-id --sessionStorage=cookie --guestSession=true --no-interactive`,
            );
        });

        afterAll(async () => {
            updateFile(`apps/${project}/tsconfig.json`, config);
            await runNxCommandAsync('reset');
        });

        it('adds new files for NextAuth', () => {
            expect(() =>
                checkFilesExist(
                    `apps/${project}/src/app/api/auth/[...nextauth]/route.ts`,
                    `apps/${project}/.env.local`,
                    `libs/ms-entra-id/src/index.ts`,
                    `libs/ms-entra-id/src/providers/microsoft-entra-id.ts`,
                    `libs/ms-entra-id/src/providers/guest.ts`,
                ),
            ).not.toThrow();
        });

        it('can serve the application', async () => {
            expect(await runTarget(project, targetOptions.start)).toBeTruthy();
        });
    });

    describe('Auth0 NextAuth generator', () => {
        //We want the last set of provider tests to not cleanup so the following tests can still build with next-auth
        // let config: string;
        beforeAll(async () => {
            // config = readFile(`apps/${project}/tsconfig.json`);
            await runNxCommandAsync(
                `generate @ensono-stacks/next:next-auth --name=auth0 --project=${project} --provider=auth0 --sessionStorage=redis --guestSession=true --no-interactive`,
            );
        });

        afterAll(async () => {
            // updateFile(`apps/${project}/tsconfig.json`, config);
            await runNxCommandAsync('reset');
        });

        it('adds new files for NextAuth', () => {
            expect(() =>
                checkFilesExist(
                    `apps/${project}/src/app/api/auth/[...nextauth]/route.ts`,
                    `apps/${project}/.env.local`,
                    `libs/auth0/src/index.ts`,
                    `libs/auth0/src/providers/auth0.ts`,
                    `libs/auth0/src/providers/guest.ts`,
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
            const projectJson = readJson(`apps/${project}/project.json`);

            expect(JSON.stringify(projectJson)).toContain('storybook');
        });

        it('should modify tsconfig.json with storybook command', async () => {
            const tsconfigJson = readJson(`apps/${project}/tsconfig.json`);

            expect(JSON.stringify(tsconfigJson)).toContain('stories');
        });

        it('should modify .eslintrc.json with storybook command', async () => {
            const eslintConfigJson = readJson(`apps/${project}/.eslintrc.json`);

            expect(JSON.stringify(eslintConfigJson)).toContain('storybook');
        });

        describe('it generates a component using custom command', () => {
            beforeAll(async () => {
                await runNxCommandAsync(
                    `run ${project}:custom-component --name=testcomponent --folderPath=components --verbose`,
                );
            });

            it('adds new files for Storybook component', () => {
                expect(() =>
                    checkFilesExist(
                        `apps/${project}/components/testcomponent/testcomponent.module.css`,
                        `apps/${project}/components/testcomponent/testcomponent.spec.tsx`,
                        `apps/${project}/components/testcomponent/testcomponent.stories.tsx`,
                        `apps/${project}/components/testcomponent/testcomponent.tsx`,
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
