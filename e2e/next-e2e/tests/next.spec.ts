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
    uniq,
} from '@nx/plugin/testing';
import { Project } from 'ts-morph';

describe('next e2e', () => {
    jest.setTimeout(1_000_000);
    process.env.HUSKY = '0';
    const project = 'nextjs1631040'; //uniq('nextjs');

    beforeAll(async () => {
        // await newProject('@ensono-stacks/next', ['@nx/next']);
        // await createNextApplication(project);
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

    // it('configures NextAuth with Redis adapter', async () => {
    //     await runNxCommandAsync(
    //         `generate @ensono-stacks/next:next-auth --project=${project} --provider=azureAd --no-interactive`,
    //     );
    //     await runNxCommandAsync(
    //         `generate @ensono-stacks/next:next-auth-redis --project=${project} --no-interactive`,
    //     );
    //     expect(() =>
    //         checkFilesExist(
    //             `apps/${project}/pages/api/auth/[...nextauth].ts`,
    //             `apps/${project}/.env.local`,
    //             `libs/next-auth-redis/src/index.test.ts`,
    //             `libs/next-auth-redis/src/index.ts`,
    //         ),
    //     ).not.toThrow();

    //     const result = await runNxCommandAsync('test next-auth-redis');
    //     expect(result.stderr).not.toEqual(expect.stringContaining('FAIL'));
    // }, 200_000);
});
