import { tsMorphTree } from '@ensono-stacks/core';
import { checkFilesExistInTree, createNextApp } from '@ensono-stacks/test';
import { joinPathFragments, readJson, Tree } from '@nx/devkit';

import generator from './generator';
import { CypressGeneratorSchema } from './schema';
import { checkOneOccurence } from '../../utils/test-utils';
import {
    CYPRESS_VERSION,
    CYPRESSMULTIREPORTERS_VERSION,
    MOCHAWESOME_VERSION,
    MOCHAWESOMEJUNITREPORTER_VERSION,
    MOCHAWESOMEMERGE_VERSION,
    CYPRESSGREP_VERSION,
} from '../../versions';

const applicationName = 'application';
const applicationDirectory = `apps/${applicationName}`;
const E2EApplicationDirectory = `apps/${applicationName}-e2e`;

let appTree: Tree;
let options: CypressGeneratorSchema;

jest.mock('@nx/devkit', () => {
    const actual = jest.requireActual('@nx/devkit');

    return {
        ...actual,
        getProjects: jest.fn(
            () =>
                new Map([
                    [
                        applicationName,
                        {
                            root: applicationDirectory,
                            sourceRoot: applicationDirectory,
                            name: applicationName,
                        },
                    ],
                ]),
        ),
    };
});

function snapshotFiles(tree, ...files: string[]) {
    expect(() => checkFilesExistInTree(tree, ...files)).not.toThrowError();
    const project = tsMorphTree(tree);
    files.forEach(file => {
        expect(project.addSourceFileAtPath(file).getText()).toMatchSnapshot(
            file,
        );
    });
}

describe('cypress generator', () => {
    beforeEach(async () => {
        options = {
            project: applicationName,
        };
        appTree = await createNextApp(options.project);
    });

    it('should resolve false if the project already exists', async () => {
        await generator(appTree, options);
        await expect(generator(appTree, options)).resolves.toBe(false);
    }, 100_000);

    describe('executedGenerators', () => {
        beforeEach(async () => {
            await generator(appTree, options);
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('CypressInit'),
            ).toBe(true);
        });

        it('should return false from method and exit generator if already executed', async () => {
            const gen = await generator(appTree, {
                ...options,
            });

            expect(gen).toBe(false);
        });
    });
});

describe('should run successfully with default options', () => {
    let project;

    beforeAll(async () => {
        options = {
            project: applicationName,
        };
        appTree = await createNextApp(options.project);
        await generator(appTree, options);
        project = tsMorphTree(appTree);
    });

    it('should install deps into package.json', () => {
        const packageJson = readJson(appTree, 'package.json');
        expect(packageJson?.devDependencies).toMatchObject(
            expect.objectContaining({
                cypress: CYPRESS_VERSION,
                'cypress-multi-reporters': CYPRESSMULTIREPORTERS_VERSION,
                mochawesome: MOCHAWESOME_VERSION,
                'mochawesome-merge': MOCHAWESOMEMERGE_VERSION,
                'mocha-junit-reporter': MOCHAWESOMEJUNITREPORTER_VERSION,
                '@cypress/grep': CYPRESSGREP_VERSION,
            }),
        );
    });

    it('should update the applications eslintrc.json', () => {
        const eslintrc = readJson(
            appTree,
            joinPathFragments(E2EApplicationDirectory, '.eslintrc.json'),
        );

        expect(
            checkOneOccurence(
                eslintrc.overrides[0].parserOptions.project,
                joinPathFragments(
                    E2EApplicationDirectory,
                    'tsconfig(.*)?.json',
                ),
            ),
        ).toBeTruthy();
    });

    it('should update the gitignore', () => {
        // expect .gitignore entries to be added
        const gitIgnoreFile = appTree.read('/.gitignore', 'utf8');
        expect(gitIgnoreFile).toContain('**/test-results');
    });

    it('should update the project cypress config', () => {
        snapshotFiles(
            appTree,
            joinPathFragments(
                `${E2EApplicationDirectory}`,
                'cypress.config.ts',
            ),
        );
    });

    it('should update the project.json with the html-report target', () => {
        const projectJson = readJson(
            appTree,
            joinPathFragments(`${E2EApplicationDirectory}`, 'project.json'),
        );
        expect(projectJson.targets.e2e).toBeTruthy();

        // update this to include the actual app name
        const expectedJson = {
            executor: 'nx:run-commands',
            options: {
                commands: [
                    'mochawesome-merge reports-json-file/app.json -o merged-html-report.json',
                    'marge merged-html-report.json ./ --inline',
                ],
                parallel: false,
                cwd: `${E2EApplicationDirectory}/test-results/downloads`,
            },
            configurations: {
                ci: {
                    cwd: 'test-results/application-e2e/downloads',
                },
            },
        };

        expect(projectJson.targets['html-report']).toBeTruthy();
        expect(projectJson.targets['html-report']).toEqual(expectedJson);
    });

    it('should set up the example files', () => {
        snapshotFiles(
            appTree,
            joinPathFragments(
                E2EApplicationDirectory,
                'src',
                'fixtures',
                'example.json',
            ),
            joinPathFragments(
                E2EApplicationDirectory,
                'src',
                'support',
                'commands.ts',
            ),
        );
    });

    it('should update the support e2e file', () => {
        snapshotFiles(
            appTree,
            joinPathFragments(
                E2EApplicationDirectory,
                'src',
                'support',
                'e2e.ts',
            ),
        );
    });

    describe('should move the tsconfig.cy.json into the cypress directory and configure it', () => {
        it('has removed the tsconfig.cy.json from the app directory', () => {
            expect(
                appTree.exists(
                    joinPathFragments(applicationDirectory, 'tsconfig.cy.json'),
                ),
            ).toBeFalsy();
        });

        it('has excluded cypress from the application tsconfig.json', () => {
            const configJson = readJson(
                appTree,
                joinPathFragments(
                    E2EApplicationDirectory,
                    'src',
                    'tsconfig.json',
                ),
            );
            expect(
                checkOneOccurence(configJson.exclude, 'cypress/**/**'),
            ).toBeTruthy();
            expect(
                checkOneOccurence(configJson.exclude, 'cypress.config.ts'),
            ).toBeTruthy();
        });

        it('has configured the new tsconfig.json within the cypress directory', () => {
            snapshotFiles(
                appTree,
                joinPathFragments(
                    E2EApplicationDirectory,
                    'src',
                    'tsconfig.json',
                ),
            );
        });
    });

    it('should update the tsconfig.base.json', () => {
        const tsconfig = readJson(appTree, 'tsconfig.base.json');
        expect(tsconfig.compilerOptions.sourceMap).toBe(false);
    });
});
