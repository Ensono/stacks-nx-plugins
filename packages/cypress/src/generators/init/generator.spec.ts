import { tsMorphTree } from '@ensono-stacks/core';
import { addStacksAttributes } from '@ensono-stacks/test';
import { joinPathFragments, readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';
import { Schema as NextSchema } from '@nrwl/next/src/generators/application/schema';
import exp from 'constants';
import * as fs from 'fs';
import path from 'path';
import { SyntaxKind } from 'ts-morph';

import generator from './generator';
import { CypressGeneratorSchema } from './schema';

const projectName = 'test';
const projectNameE2E = `${projectName}-e2e`;

let appTree: Tree;
let options: CypressGeneratorSchema;

jest.mock('@nrwl/devkit', () => {
    const actual = jest.requireActual('@nrwl/devkit');

    return {
        ...actual,
        getProjects: jest.fn(
            () =>
                new Map([
                    [
                        'test',
                        {
                            root: '',
                            sourceRoot: `${projectName}`,
                            name: 'test',
                        },
                    ],
                ]),
        ),
    };
});

function compareToFile(fileInTree, fileToMatchAgainstPath: string) {
    const expectedFileContents = fs
        .readFileSync(path.resolve(__dirname, fileToMatchAgainstPath), 'utf-8')
        .replace(/(\r)/gm, '')
        .trim();
    const fileContents = fileInTree.getFullText().trim();
    expect(fileContents).toBe(expectedFileContents);
}

async function createNextApp(schema?: Partial<NextSchema>) {
    appTree = createTreeWithEmptyWorkspace();
    await applicationGenerator(appTree, {
        name: projectName,
        style: 'css',
        ...schema,
    });

    addStacksAttributes(appTree, options.project);
}

describe('cypress generator', () => {
    beforeEach(async () => {
        options = {
            project: projectName,
        };
        await createNextApp();
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
            project: projectName,
        };
        await createNextApp();
        await generator(appTree, options);
        project = tsMorphTree(appTree);
    });

    it('should update the eslintrc.json', () => {
        const eslintrc = readJson(appTree, '/.eslintrc.json');
        expect(eslintrc.plugins).toContain('cypress');
        expect(eslintrc.overrides[1].extends).toContain(
            'plugin:cypress/recommended',
        );
    });

    it('should update the gitignore', () => {
        // expect .gitignore entries to be added
        const gitIgnoreFile = appTree.read('/.gitignore', 'utf-8');
        expect(gitIgnoreFile).toContain('**/test-results');
    });

    it('should update the project cypress config', () => {
        // expect cypress config to be updated
        expect(
            appTree.exists(path.join(projectNameE2E, 'cypress.config.ts')),
        ).toBeTruthy();

        const projectConfigFile = project.addSourceFileAtPath(
            `${projectNameE2E}/cypress.config.ts`,
        );
        compareToFile(
            projectConfigFile,
            './files/e2e-folder/cypress.config.ts__template__',
        );
    });

    it('should update the project.json with the html-report target', () => {
        const projectJson = readJson(
            appTree,
            joinPathFragments(projectNameE2E, 'project.json'),
        );
        expect(projectJson.targets.e2e).toBeTruthy();
        const expectedJson = {
            executor: 'nx:run-commands',
            options: {
                commands: [
                    'mochawesome-merge reports-json-file/*.json>merged-html-report.json',
                    'marge merged-html-report.json --reportDir ./ --inline',
                ],
                parallel: false,
                cwd: 'apps/next-app-e2e/test-results/downloads',
            },
            configurations: {
                ci: {
                    cwd: 'apps/../test-results/next-app-e2e/downloads',
                },
            },
        };
        expect(projectJson.targets['html-report']).toBeTruthy();
        expect(projectJson.targets['html-report']).toEqual(expectedJson);
    });

    it('should set up the example files', () => {
        expect(
            appTree.exists(
                path.join(projectNameE2E, 'src', 'e2e', 'app.cy.ts'),
            ),
        ).toBeFalsy();
        expect(
            appTree.exists(
                path.join(projectNameE2E, 'src', 'support', 'app.po.ts'),
            ),
        ).toBeFalsy();
        const filePath = path.join(
            projectNameE2E,
            'src',
            'e2e',
            'example.cy.ts',
        );
        expect(appTree.exists(filePath)).toBeTruthy();
        compareToFile(
            project.addSourceFileAtPath(filePath),
            './files/e2e-folder/src/e2e/example.cy.ts__template__',
        );
    });

    it('should update the support e2e file', () => {
        const filePath = path.join(projectNameE2E, 'src', 'support', 'e2e.ts');
        expect(appTree.exists(filePath)).toBeTruthy();
        compareToFile(
            project.addSourceFileAtPath(filePath),
            './files/e2e-folder/src/support/e2e.ts__template__',
        );
    });

    it('should update the tsconfig.json', () => {
        const configJson = readJson(
            appTree,
            joinPathFragments(projectNameE2E, 'tsconfig.json'),
        );
        expect(
            configJson.compilerOptions['allowSyntheticDefaultImports'],
        ).toEqual(true);
    });

    it('should create the base cypress configuration', () => {
        const filePath = 'cypress.config.base.ts';
        expect(appTree.exists(filePath)).toBeTruthy();
        compareToFile(
            project.addSourceFileAtPath(filePath),
            './files/root/cypress.config.base.ts__template__',
        );
    });
});
