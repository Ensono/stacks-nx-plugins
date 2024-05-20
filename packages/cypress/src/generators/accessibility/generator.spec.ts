import { tsMorphTree } from '@ensono-stacks/core';
import { createNextApp } from '@ensono-stacks/test';
import { joinPathFragments, readJson, Tree } from '@nx/devkit';
import * as fs from 'fs';
import path from 'path';

import generator from './generator';
import { AccessibilityGeneratorSchema } from './schema';
import { terminalLogAxeBody } from './utils/update-files';
import { checkOneOccurence } from '../../utils/test-utils';
import { AXECORE_VERSION, CYPRESSAXE_VERSION } from '../../versions';
import initGenerator from '../init/generator';

const applicationName = 'application';
const applicationDirectory = `apps/${applicationName}`;
const E2EApplicationDirectory = `apps/${applicationName}-e2e`;

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

function compareToFile(fileInTree, fileToMatchAgainstPath: string) {
    const expectedFileContents = fs
        .readFileSync(path.resolve(__dirname, fileToMatchAgainstPath), 'utf8')
        .replaceAll(/(\r)/gm, '')
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
    });

    it('should raise an error if a cypress app has not yet been added', async () => {
        await generator(appTree, options).catch(error => {
            expect(error.message).toEqual(
                'The dependent CypressInit generator has not been executed',
            );
        });
    });

    it('should raise an error if an invalid project is specified', async () => {
        await generator(appTree, { project: 'nosuchproject' }).catch(error => {
            expect(error.message).toEqual('nosuchproject does not exist.');
        });
    });

    it('should correctly update the setUpNodeEvents if it already exists', async () => {
        await initGenerator(appTree, options);
        const config = project.addSourceFileAtPath(
            joinPathFragments(E2EApplicationDirectory, 'cypress.config.ts'),
        );
        config.replaceWithText(`export default defineConfig({
            ...baseConfig,
            e2e: {
              setupNodeEvents(on, config) {
                on('before:browser:launch', (file) => {
                    //do something
                });
              },
            },
          });`);
        config.saveSync();
        await generator(appTree, options);
        expect(
            appTree
                .read(
                    joinPathFragments(
                        E2EApplicationDirectory,
                        'cypress.config.ts',
                    ),
                )
                .toString(),
        ).toMatchSnapshot();
    });

    describe('should correctly add accessibility', () => {
        beforeEach(async () => {
            await initGenerator(appTree, options);
            await generator(appTree, options);
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.project[
                    options.project
                ].includes('CypressAccessibility'),
            ).toBe(true);
        });

        it('should throw an error if the generator has ran before', async () => {
            const gen = await generator(appTree, {
                ...options,
            });
            expect(gen).toBe(false);
        });

        it('should run successfully and create the accessibility test', async () => {
            // axe-accessibility.spec.ts to be added
            const filePath = joinPathFragments(
                E2EApplicationDirectory,
                'src',
                'e2e',
                'axe-accessibility.cy.ts',
            );
            expect(appTree.exists(filePath)).toBeTruthy();
            compareToFile(
                project.addSourceFileAtPath(filePath),
                './files/src/e2e/axe-accessibility.cy.ts__template__',
            );
        });

        it('should update the package.json with the required dependencies', () => {
            // expect package.json updated
            const packageJson = JSON.parse(
                appTree.read('/package.json', 'utf8'),
            );
            expect(packageJson?.devDependencies).toMatchObject({
                'axe-core': AXECORE_VERSION,
                'cypress-axe': CYPRESSAXE_VERSION,
            });
        });

        it('should update the applications cypress.config.ts', () => {
            expect(
                appTree
                    .read(
                        joinPathFragments(
                            E2EApplicationDirectory,
                            'cypress.config.ts',
                        ),
                    )
                    .toString(),
            ).toMatchSnapshot();
        });

        it('should update the applications e2e.ts support file', () => {
            const filePath = joinPathFragments(
                E2EApplicationDirectory,
                'src',
                'support',
                'e2e.ts',
            );
            const file = project.addSourceFileAtPath(filePath);
            const expectedFunction = file.getFunction('terminalLogAxe');
            const parameters = expectedFunction.getParameters();
            expect(parameters.length).toEqual(1);
            const violationsParameter = expectedFunction
                .getParameters()
                .find(parameter => parameter.getName() === 'violations');
            const parameterType = violationsParameter.getType().getText();
            expect(parameterType).toBe('Result[]');
            expect(expectedFunction?.getBodyText()).toBe(terminalLogAxeBody);
            const importExists = file
                .getImportDeclarations()
                .some(
                    importDecl =>
                        importDecl.getModuleSpecifierValue() === 'axe-core' &&
                        importDecl
                            .getNamedImports()
                            .some(
                                namedImport =>
                                    namedImport.getName() === 'Result',
                            ),
                );
            expect(importExists).toBe(true);
        });

        it('should update the applications cypress tsconfig.json file', () => {
            const tsconfig = readJson(
                appTree,
                joinPathFragments(
                    E2EApplicationDirectory,
                    'src',
                    'tsconfig.json',
                ),
            );
            expect(
                checkOneOccurence(
                    tsconfig.compilerOptions.types,
                    'cypress-axe',
                ),
            ).toBeTruthy();
        });
    });
});
