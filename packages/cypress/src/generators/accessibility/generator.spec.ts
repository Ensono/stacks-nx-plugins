import { tsMorphTree } from '@ensono-stacks/core';
import { joinPathFragments, readJson, Tree } from '@nrwl/devkit';
import * as fs from 'fs';
import path from 'path';
import { SyntaxKind } from 'ts-morph';

import { checkOneOccurence, createNextApp } from '../../utils/test-utils';
import { AXECORE, CYPRESSAXE } from '../../versions';
import initGenerator from '../init/generator';
import generator from './generator';
import { AccessibilityGeneratorSchema } from './schema';
import { terminalLogAxeBody } from './utils/update-files';

const applicationName = 'application';
const applicationDirectory = `apps/${applicationName}`;
const cypressDirectory = joinPathFragments(applicationDirectory, 'cypress');

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

describe('cypress accessibility generator', () => {
    let appTree: Tree;
    let options: AccessibilityGeneratorSchema;
    let project;
    beforeEach(async () => {
        options = {
            project: applicationName,
        };
        appTree = await createNextApp(options.project);
        project = tsMorphTree(appTree);

        await initGenerator(appTree, options);
    });

    describe('should correctly add accessibility to a fresh test project', () => {
        beforeEach(async () => {
            await generator(appTree, options);
        });

        it('should run successfully and create the accessibility test', async () => {
            // axe-accessibility.spec.ts to be added
            const filePath = joinPathFragments(
                cypressDirectory,
                'e2e',
                'axe-accessibility.cy.ts',
            );
            expect(appTree.exists(filePath)).toBeTruthy();
            compareToFile(
                project.addSourceFileAtPath(filePath),
                './files/cypress/e2e/axe-accessibility.cy.ts__template__',
            );
        }, 100_000);

        it('should update the package.json with the required dependencies', () => {
            // expect package.json updated
            const packageJson = JSON.parse(
                appTree.read('/package.json', 'utf-8'),
            );
            expect(packageJson?.devDependencies).toMatchObject({
                'axe-core': AXECORE,
                'cypress-axe': CYPRESSAXE,
            });
        });

        it('should update the applications cypress.config.ts', () => {
            // is this actually working?
            expect(
                project.addSourceFileAtPath(
                    joinPathFragments(
                        applicationDirectory,
                        'cypress.config.ts',
                    ),
                ),
            ).toMatchSnapshot();
        });

        it('should update the applications e2e.ts support file', () => {
            const filePath = joinPathFragments(
                cypressDirectory,
                'support',
                'e2e.ts',
            );
            const file = project.addSourceFileAtPath(filePath);
            const expectedFunction = file.getFunction('terminalLogAxe');
            const parameters = expectedFunction.getParameters();
            expect(parameters.length).toEqual(1);
            const structure = expectedFunction
                .getParameters()[0]
                .getStructure();
            expect(structure.name).toBe('violations');
            expect(expectedFunction?.getBodyText()).toBe(terminalLogAxeBody);
        });

        it('should update the applications tsconfig.cy.json file', () => {
            const tsconfig = readJson(
                appTree,
                joinPathFragments(applicationDirectory, 'tsconfig.cy.json'),
            );
            expect(
                checkOneOccurence(
                    tsconfig.compilerOptions.types,
                    'cypress-axe',
                ),
            ).toBeTruthy();
        });
    });

    describe('should correctly add accesibility when reran', () => {
        it('should raise an error if a cypress app has not yet been added', () => {
            expect(true).toBe(false);
        });

        it('should update the applications cypress.config.ts where there is already a setupNodeEvents', async () => {
            const filePath = joinPathFragments(
                applicationDirectory,
                'cypress.config.ts',
            );
            const file = project.addSourceFileAtPath(filePath);
            const baseConfigObject = file
                ?.getVariableDeclaration('defineConfig')
                .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
            const testConfig = baseConfigObject
                ?.getProperty('use')
                ?.getStructure();
            testConfig.add('an existing config');
            await generator(appTree, options);

            // expect package.json updated
        });
    });
});
