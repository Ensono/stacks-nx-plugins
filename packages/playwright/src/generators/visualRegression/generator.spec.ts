import { tsMorphTree } from '@ensono-stacks/core';
import { joinPathFragments, readJson, Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { SyntaxKind } from 'ts-morph';
import YAML from 'yaml';

import { APPLITOOLS_EYES_PLAYWRIGHT_VERSION } from '../../utils/versions';
import initGenerator from '../init/generator';
import generator from './generator';
import { VisualRegressionGeneratorSchema } from './schema';

const projectName = 'test';
const projectNameE2E = `${projectName}-e2e`;

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
                            sourceRoot: `${projectNameE2E}/src`,
                            name: 'test',
                        },
                    ],
                    [
                        'test-e2e',
                        {
                            root: '',
                            sourceRoot: `${projectNameE2E}/src`,
                            name: 'test-e2e',
                        },
                    ],
                ]),
        ),
    };
});

describe('playwright generator', () => {
    let appTree: Tree;

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();

        appTree.write(
            'taskctl.yaml',
            YAML.stringify({
                pipelines: {
                    dev: [
                        { task: 'lint' },
                        { task: 'build', depends_on: 'lint' },
                        { task: 'e2e:ci', depends_on: 'build' },
                        { task: 'version', depends_on: 'e2e:ci' },
                        { task: 'terraform', depends_on: 'version' },
                        { task: 'helm', depends_on: 'terraform' },
                    ],
                    fe: [
                        { task: 'lint' },
                        { task: 'build', depends_on: 'lint' },
                        { task: 'e2e:ci', depends_on: 'build' },
                        { task: 'version', depends_on: 'e2e:ci' },
                    ],
                    nonprod: [
                        { task: 'lint:ci' },
                        { task: 'build:ci', depends_on: 'lint:ci' },
                        { task: 'test:ci', depends_on: 'build:ci' },
                        { task: 'e2e:ci', depends_on: 'test:ci' },
                        { task: 'version:nonprod', depends_on: 'e2e:ci' },
                        {
                            task: 'terraform:nonprod',
                            depends_on: 'version:nonprod',
                        },
                        {
                            task: 'helm:nonprod',
                            depends_on: 'terraform:nonprod',
                        },
                    ],
                    prod: [
                        { task: 'build:ci' },
                        { task: 'test:ci', depends_on: 'build:ci' },
                        { task: 'e2e:ci', depends_on: 'test:ci' },
                        { task: 'version:prod', depends_on: 'e2e:ci' },
                        { task: 'terraform:prod', depends_on: 'version:prod' },
                        { task: 'helm:prod', depends_on: 'terraform:prod' },
                    ],
                },
            }),
        );
        updateJson(appTree, 'nx.json', nxJson => ({
            ...nxJson,
            stacks: {
                business: {
                    company: 'Amido',
                    domain: 'stacks',
                    component: 'nx',
                },
                domain: {
                    internal: 'test.com',
                    external: 'test.dev',
                },
                cloud: {
                    region: 'euw',
                    platform: 'azure',
                },
                pipeline: 'azdo',
                terraform: {
                    group: 'terraform-group',
                    storage: 'terraform-storage',
                    container: 'terraform-container',
                },
                vcs: {
                    type: 'github',
                    url: 'remote.git',
                },
            },
        }));
        appTree.write('build/tasks.yaml', YAML.stringify({ tasks: {} }));
    });

    afterEach(() => {
        appTree.delete('taskctl.yaml');
        appTree.delete('build/tasks.yaml');
    });

    it('should error if the project does not exist', async () => {
        const options: VisualRegressionGeneratorSchema = {
            project: 'non-existent-project',
            visualRegression: 'none',
        };
        await expect(generator(appTree, options)).rejects.toThrowError(
            `non-existent-project does not exist`,
        );
    });

    it('should run successfully with native regression', async () => {
        const options: VisualRegressionGeneratorSchema = {
            project: projectNameE2E,
            visualRegression: 'native',
        };
        await initGenerator(appTree, { project: projectName });
        await generator(appTree, options);

        // playwright-visual-regression.spec.ts to be added
        expect(appTree.children(`${projectNameE2E}/src`)).toContain(
            'playwright-visual-regression.spec.ts',
        );

        const project = tsMorphTree(appTree);

        // expect playwright.config.ts to be updated
        const projectConfigFile = project.addSourceFileAtPath(
            `${projectNameE2E}/playwright.config.ts`,
        );

        // Add infra tasks
        const projectJson = readJson(
            appTree,
            joinPathFragments(projectNameE2E, 'project.json'),
        );

        expect(projectJson.targets.e2e).toBeTruthy();
        expect(projectJson.targets['e2e-docker']).toBeTruthy();
        const playwrightPackageJsonVersion = readJson(appTree, 'package.json')
            ?.devDependencies?.playwright;
        expect(playwrightPackageJsonVersion).toBeTruthy();
        expect(
            projectJson.targets['e2e-docker']?.options?.commands[0]?.command,
        ).toContain('mcr.microsoft.com/playwright:jammy');

        const tasksYAML = YAML.parse(appTree.read('build/tasks.yaml', 'utf-8'));
        expect(tasksYAML.tasks['e2e:local']).toEqual({
            description: 'Run e2e tests locally',
            command: [
                'npx nx affected --base="$BASE_SHA" --target=e2e-docker --parallel=1',
            ],
        });
        expect(tasksYAML.tasks['e2e:ci']).toEqual({
            description: 'Run e2e tests in ci',
            command: [
                'npx nx affected --base="$BASE_SHA" --target=e2e --parallel=1',
            ],
        });

        const taskctlYAML = YAML.parse(appTree.read('taskctl.yaml', 'utf8'));
        expect(taskctlYAML.pipelines.updatesnapshots).toBeTruthy();
    }, 100_000);

    it('should run successfully with native regeression and azure builds have been generated', async () => {
        appTree.write('build/azDevOps/azuredevops-stages.yaml', '');
        const options: VisualRegressionGeneratorSchema = {
            project: projectNameE2E,
            visualRegression: 'native',
        };
        await initGenerator(appTree, { project: projectName });
        await generator(appTree, options);
        const azureUpdateSnapshots = YAML.parse(
            appTree.read(
                'build/azDevOps/azuredevops-updatesnapshots.yaml',
                'utf8',
            ),
        );
        expect(azureUpdateSnapshots.variables).toBeTruthy();
        expect(azureUpdateSnapshots.variables).toEqual([
            { template: 'azuredevops-vars.yaml' },
            { group: 'Amido-stacks-nx-common' },
            { name: 'DebugPreference', value: 'Continue' },
            { group: 'Amido-stacks-nx-nonprod' },
        ]);
    });

    it('should run successfully with applitools regression', async () => {
        const options: VisualRegressionGeneratorSchema = {
            project: projectNameE2E,
            visualRegression: 'applitools',
        };
        await initGenerator(appTree, { project: projectName });
        await generator(appTree, options);

        // playwright-visual-regression.spec.ts to be added
        expect(appTree.children(`${projectNameE2E}/src`)).toContain(
            'applitools-eyes-grid.spec.ts',
        );

        const project = tsMorphTree(appTree);

        // expect playwright.config.ts to be updated
        const projectConfigFile = project.addSourceFileAtPath(
            `${projectNameE2E}/playwright.config.ts`,
        );
        const projectConfigObject = projectConfigFile
            ?.getVariableDeclaration('config')
            .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

        expect(
            projectConfigObject?.getProperty('grepInvert')?.getStructure(),
        ).toEqual(
            expect.objectContaining({
                initializer: '/.*@visual-regression/',
            }),
        );

        // expect package.json updated
        const packageJson = JSON.parse(appTree.read('/package.json', 'utf-8'));
        expect(packageJson?.devDependencies).toMatchObject({
            '@applitools/eyes-playwright': APPLITOOLS_EYES_PLAYWRIGHT_VERSION,
        });
    }, 100_000);
});
