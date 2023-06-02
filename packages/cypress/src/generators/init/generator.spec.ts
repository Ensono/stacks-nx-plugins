import { tsMorphTree } from '@ensono-stacks/core';
import { addStacksAttributes } from '@ensono-stacks/test';
import { joinPathFragments, readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';
import { Schema as NextSchema } from '@nrwl/next/src/generators/application/schema';
import exp from 'constants';
import * as fs from 'fs';
import path from 'path';

import { checkOneOccurence, createNextApp } from '../../utils/test-utils';
import {
    CYPRESS_VERSION,
    CYPRESSMULTIREPORTERS_VERSION,
    MOCHAWESOME_VERSION,
    MOCHAWESOMEJUNITREPORTER_VERSION,
    MOCHAWESOMEMERGE_VERSION,
    NRWLCYPRESS_VERSION,
} from '../../versions';
import generator from './generator';
import { CypressGeneratorSchema } from './schema';

const applicationName = 'application';
const applicationDirectory = `apps/${applicationName}`;
const cypressDirectory = joinPathFragments(applicationDirectory, 'cypress');

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

function compareToFile(fileInTree, fileToMatchAgainstPath: string) {
    const expectedFileContents = fs
        .readFileSync(path.resolve(__dirname, fileToMatchAgainstPath), 'utf-8')
        .replace(/(\r)/gm, '')
        .trim();
    const fileContents = fileInTree.getFullText().trim();
    expect(fileContents).toBe(expectedFileContents);
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
        expect(packageJson?.devDependencies).toMatchObject({
            cypress: CYPRESS_VERSION,
            '@nrwl/cypress': NRWLCYPRESS_VERSION,
            'cypress-multi-reporters': CYPRESSMULTIREPORTERS_VERSION,
            mochawesome: MOCHAWESOME_VERSION,
            'mochawesome-merge': MOCHAWESOMEMERGE_VERSION,
            'mocha-junit-reporter': MOCHAWESOMEJUNITREPORTER_VERSION,
        });
    });

    it('should update the eslintrc.json', () => {
        const eslintrc = readJson(appTree, '/.eslintrc.json');
        expect(checkOneOccurence(eslintrc.plugins, 'cypress')).toBeTruthy();
        expect(
            checkOneOccurence(
                eslintrc.overrides[1].extends,
                'plugin:cypress/recommended',
            ),
        ).toBeTruthy();
    });

    it('should update the gitignore', () => {
        // expect .gitignore entries to be added
        const gitIgnoreFile = appTree.read('/.gitignore', 'utf-8');
        expect(gitIgnoreFile).toContain('**/test-results');
    });

    it('should update the project cypress config', () => {
        // expect cypress config to be updated
        expect(
            appTree.exists(
                joinPathFragments(applicationDirectory, 'cypress.config.ts'),
            ),
        ).toBeTruthy();

        const projectConfigFile = project.addSourceFileAtPath(
            joinPathFragments(applicationDirectory, 'cypress.config.ts'),
        );
        compareToFile(
            projectConfigFile,
            './files/e2e-folder/cypress.config.ts__template__',
        );
    });

    it('should update the project.json with the html-report target', () => {
        const projectJson = readJson(
            appTree,
            joinPathFragments(applicationDirectory, 'project.json'),
        );
        expect(projectJson.targets.e2e).toBeTruthy();

        // update this to include the actual app name
        const expectedJson = {
            executor: 'nx:run-commands',
            options: {
                commands: [
                    'mochawesome-merge reports-json-file/*.json>merged-html-report.json',
                    'marge merged-html-report.json --reportDir ./ --inline',
                ],
                parallel: false,
                cwd: `${applicationDirectory}/cypress/test-results/downloads`,
            },
            configurations: {
                ci: {
                    cwd: `${applicationDirectory}/../../test-results/${applicationName}/downloads`,
                },
            },
        };
        expect(projectJson.targets['html-report']).toBeTruthy();
        expect(projectJson.targets['html-report']).toEqual(expectedJson);
    });

    it('should set up the example files', () => {
        expect(
            appTree.exists(
                joinPathFragments(cypressDirectory, 'e2e', 'app.cy.ts'),
            ),
        ).toBeFalsy();
        expect(
            appTree.exists(
                joinPathFragments(cypressDirectory, 'support', 'app.po.ts'),
            ),
        ).toBeFalsy();
        const filePath = joinPathFragments(
            cypressDirectory,
            'e2e',
            'example.cy.ts',
        );
        expect(appTree.exists(filePath)).toBeTruthy();
        compareToFile(
            project.addSourceFileAtPath(filePath),
            './files/e2e-folder/cypress/e2e/example.cy.ts__template__',
        );
    });

    it('should update the support e2e file', () => {
        const filePath = joinPathFragments(
            cypressDirectory,
            'support',
            'e2e.ts',
        );
        expect(appTree.exists(filePath)).toBeTruthy();
        compareToFile(
            project.addSourceFileAtPath(filePath),
            './files/e2e-folder/cypress/support/e2e.ts__template__',
        );
    });

    it('should update the tsconfig.cy.json', () => {
        const configJson = readJson(
            appTree,
            joinPathFragments(applicationDirectory, 'tsconfig.cy.json'),
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

    it('should update the tsconfig.base.json', () => {
        const tsconfig = readJson(appTree, 'tsconfig.base.json');
        expect(tsconfig.compilerOptions.sourceMap).toBe(false);
    });
});