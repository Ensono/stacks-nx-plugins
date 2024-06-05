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
                expect(await runTarget(project, targetOptions.lint)).toBeTruthy();
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

        afterAll(async () => {
            await runNxCommandAsync('reset');
        });
    
        it('adds new files for NextAuth', () => {
            expect(() =>
                checkFilesExist(
                    `apps/${project}/src/app/api/hello/route.ts`,
                    `apps/${project}/src/app/api/auth/[...nextauth]/route.ts`,
                    `apps/${project}/src/auth.config.ts`,
                    `apps/${project}/src/auth.ts`,
                    `apps/${project}/src/middleware.ts`,
                    `apps/${project}/.env.local`,
                ),
            ).not.toThrow();
        });
    
        it('can serve the application', async () => {
            expect(await runTarget(project, targetOptions.start)).toBeTruthy();
        });
    });

    describe('NextAuthRedis generator', () => {
        const adapterName = 'next-redis-lib'
        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/next:next-auth-redis --project=${project} --adapterName=${adapterName} --no-interactive`,
            );
        });

        afterAll(async () => {
            await runNxCommandAsync('reset');
        });
    
        it('adds new files for NextAuthRedis generator', () => {
            expect(() =>
                checkFilesExist(
                    `libs/${adapterName}/src/index.ts`,
                    `libs/${adapterName}/src/index.test.ts`
                ),
            ).not.toThrow();
        });
    });
    
    xdescribe('init-deployment generator', () => {
        const library = 'stacks-helm-chart';
        beforeAll(async () => {
            await runNxCommandAsync(
                `generate @ensono-stacks/next:init-deployment --project=${project} --libraryName=${library} --no-interactive`,
            );
        });

        afterAll(async () => {
            await runNxCommandAsync('reset');
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

    xdescribe('storybook generator', () => {
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


            expect(JSON.stringify(projectJson)).toContain('storybook')
        });

        it('should modify tsconfig.json with storybook command', async () => {
            const tsconfigJson = readJson(`apps/${project}/tsconfig.json`);

            expect(JSON.stringify(tsconfigJson)).toContain('stories')
        });

        it('should modify .eslintrc.json with storybook command', async () => {
            const eslintConfigJson = readJson(`apps/${project}/.eslintrc.json`);

            expect(JSON.stringify(eslintConfigJson)).toContain('storybook')
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
                        `apps/${project}/components/testcomponent/testcomponent.tsx`
                    ),
                ).not.toThrow();
            });

            it('can serve the storybook application', async () => {
                expect(await runTarget(`${project}:storybook`, targetOptions.start, 'Storybook 7.4.5 for nextjs started')).toBeTruthy();
            });
        })
    });
});
