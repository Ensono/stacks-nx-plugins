import { tsMorphTree } from '@ensono-stacks/core';
import { joinPathFragments, readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { SyntaxKind } from 'ts-morph';
import YAML from 'yaml';

import initGenerator from '../init/generator';
import generator from './generator';
import { VisualRegressionGeneratorSchema } from './schema';

describe('playwright generator', () => {
    let appTree: Tree;
    const projectName = 'test-e2e';

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();

        appTree.write(
            'taskctl.yaml',
            YAML.stringify({
                pipelines: { dev: [], fe: [], nonprod: [], prod: [] },
            }),
        );
        appTree.write('build/tasks.yaml', YAML.stringify({ tasks: {} }));
    });

    afterEach(() => {
        appTree.delete('taskctl.yaml');
        appTree.delete('build/tasks.yaml');
    });

    it('should error if the project does not exist', async () => {
        const options: VisualRegressionGeneratorSchema = {
            project: projectName,
            visualRegression: 'none',
        };
        await expect(generator(appTree, options)).rejects.toThrowError(
            `${projectName} does not exist`,
        );
    });

    it('should run successfully with native regression', async () => {
        const options: VisualRegressionGeneratorSchema = {
            project: projectName,
            visualRegression: 'native',
        };
        await initGenerator(appTree, options);
        await generator(appTree, options);

        // playwright-visual-regression.spec.ts to be added
        expect(appTree.children(`${projectName}/src`)).toContain(
            'playwright-visual-regression.spec.ts',
        );

        const project = tsMorphTree(appTree);

        // expect playwright.config.ts to be updated
        const projectConfigFile = project.addSourceFileAtPath(
            `${projectName}/playwright.config.ts`,
        );
        const projectConfigObject = projectConfigFile
            ?.getVariableDeclaration('config')
            .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

        expect(
            projectConfigObject?.getProperty('updateSnapshots')?.getStructure(),
        ).toEqual(
            expect.objectContaining({
                initializer: `'missing'`,
            }),
        );
        expect(
            projectConfigObject?.getProperty('expect')?.getStructure(),
        ).toEqual(
            expect.objectContaining({
                initializer: `{
                        toHaveScreenshot: {
                          threshold: 0.2,
                          animations: 'disabled',
                        },
                      }`,
            }),
        );

        // Add infra tasks
        const projectJson = readJson(
            appTree,
            joinPathFragments(projectName, 'project.json'),
        );
        expect(projectJson.targets.e2e).toBeTruthy();
        expect(projectJson.targets['e2e-docker']).toBeTruthy();

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
        expect(taskctlYAML.pipelines.dev).toContainEqual({ task: 'e2e:local' });
        expect(taskctlYAML.pipelines.fe).toContainEqual({ task: 'e2e:local' });
        expect(taskctlYAML.pipelines.nonprod).toContainEqual({
            task: 'e2e:ci',
        });
        expect(taskctlYAML.pipelines.prod).toContainEqual({ task: 'e2e:ci' });
    }, 20_000);

    it('should run successfully with applitools regression', async () => {
        const options: VisualRegressionGeneratorSchema = {
            project: projectName,
            visualRegression: 'applitools',
        };
        await initGenerator(appTree, options);
        await generator(appTree, options);

        // playwright-visual-regression.spec.ts to be added
        expect(appTree.children(`${projectName}/src`)).toContain(
            'applitools-eyes-grid.spec.ts',
        );

        const project = tsMorphTree(appTree);

        // expect playwright.config.ts to be updated
        const projectConfigFile = project.addSourceFileAtPath(
            `${projectName}/playwright.config.ts`,
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
            '@applitools/eyes-playwright': '1.13.0',
        });
    }, 100_000);
});
