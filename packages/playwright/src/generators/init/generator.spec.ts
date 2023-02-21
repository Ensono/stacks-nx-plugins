import { tsMorphTree } from '@ensono-stacks/core';
import initPlaywrightGenerator from '@mands/nx-playwright/src/generators/project/generator';
import { NxPlaywrightGeneratorSchema } from '@mands/nx-playwright/src/generators/project/schema-types';
import { PackageRunner } from '@mands/nx-playwright/src/types';
import { joinPathFragments, readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Linter } from '@nrwl/linter';
import { SyntaxKind } from 'ts-morph';
import YAML from 'yaml';

import generator from './generator';
import { PlaywrightGeneratorSchema } from './schema';

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
        appTree.write(
            'build/taskctl/tasks.yaml',
            YAML.stringify({ tasks: {} }),
        );
    });

    afterEach(() => {
        appTree.delete('taskctl.yaml');
        appTree.delete('build/taskctl/tasks.yaml');
    });

    it('should error if the project does not exist', async () => {
        const options: PlaywrightGeneratorSchema = {
            project: projectName,
            accessibility: false,
            visualRegression: 'none',
        };
        await expect(generator(appTree, options)).rejects.toThrowError(
            `${projectName} project does not exist`,
        );
    });

    it('should run successfully with default options', async () => {
        const packageRunner: PackageRunner = 'npx';
        const playwrightGeneratorSchema: NxPlaywrightGeneratorSchema = {
            name: projectName,
            linter: Linter.EsLint,
            packageRunner,
        };
        await initPlaywrightGenerator(appTree, playwrightGeneratorSchema);

        const options: PlaywrightGeneratorSchema = {
            project: projectName,
            accessibility: false,
            visualRegression: 'none',
        };
        await generator(appTree, options);

        // example.spec.ts to be added
        expect(appTree.children(`${projectName}/src`)).toContain(
            'example.spec.ts',
        );

        const project = tsMorphTree(appTree);

        // expect playwright.config.base.ts to be updated
        const baseConfigFile = project.addSourceFileAtPath(
            'playwright.config.base.ts',
        );
        const baseConfigObject = baseConfigFile
            ?.getVariableDeclaration('baseConfig')
            .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

        expect(
            baseConfigObject?.getProperty('maxFailures')?.getStructure(),
        ).toEqual(
            expect.objectContaining({
                initializer: 'process.env.CI ? 10 : undefined',
            }),
        );
        expect(
            baseConfigObject?.getProperty('forbidOnly')?.getStructure(),
        ).toEqual(
            expect.objectContaining({
                initializer: '!!process.env.CI',
            }),
        );
        expect(
            baseConfigFile
                .getVariableDeclaration('baseURL')
                .getDescendantsOfKind(SyntaxKind.Identifier)
                .find(identifier => identifier.getText() === 'BASE_URL'),
        ).toBeTruthy();

        // expect playwright.config.ts to be updated
        const projectConfigFile = project.addSourceFileAtPath(
            `${projectName}/playwright.config.ts`,
        );
        const projectConfigObject = projectConfigFile
            ?.getVariableDeclaration('config')
            .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
        expect(
            projectConfigObject?.getProperty('use')?.getStructure(),
        ).toBeTruthy();
        expect(
            projectConfigObject?.getProperty('projects')?.getStructure(),
        ).toEqual(
            expect.objectContaining({
                initializer: `[
                      {
                        name: 'chromium',
                        use: {
                          ...devices['Desktop Chrome'],
                        },
                      },
                      {
                        name: 'firefox',
                        use: {
                          ...devices['Desktop Firefox'],
                        },
                      },
                  
                      {
                        name: 'webkit',
                        use: {
                          ...devices['Desktop Safari'],
                        },
                      },
                  
                      /* Test against mobile viewports. */
                      {
                        name: 'Mobile Chrome',
                        use: {
                          ...devices['Pixel 5'],
                        },
                      },
                      {
                        name: 'Mobile Safari',
                        use: {
                          ...devices['iPhone 12'],
                        },
                      },
                    ]`,
            }),
        );

        // expect .gitignore entries to be added
        const gitIgnoreFile = appTree.read('/.gitignore', 'utf-8');
        expect(gitIgnoreFile).toContain('**/test-results');
        expect(gitIgnoreFile).toContain('**/playwright-report');
        expect(gitIgnoreFile).toContain('**/playwright/.cache');

        // Add infra tasks
        const projectJson = readJson(
            appTree,
            joinPathFragments(projectName, 'project.json'),
        );
        expect(projectJson.targets.e2e).toBeTruthy();

        const tasksYAML = YAML.parse(
            appTree.read('build/taskctl/tasks.yaml', 'utf-8'),
        );
        expect(tasksYAML.tasks.e2e).toEqual({
            description: 'Run e2e tests',
            command: [
                'npx nx affected --base="$BASE_SHA" --target=e2e --parallel=1',
            ],
        });

        const taskctlYAML = YAML.parse(appTree.read('taskctl.yaml', 'utf8'));
        expect(taskctlYAML.pipelines.dev).toContainEqual({ task: 'e2e' });
        expect(taskctlYAML.pipelines.fe).toContainEqual({ task: 'e2e' });
        expect(taskctlYAML.pipelines.nonprod).toContainEqual({
            task: 'e2e',
        });
        expect(taskctlYAML.pipelines.prod).toContainEqual({ task: 'e2e' });
    });

    it('should prevent configuration being duplicated in playwright.config.ts', async () => {
        const packageRunner: PackageRunner = 'npx';
        const playwrightGeneratorSchema: NxPlaywrightGeneratorSchema = {
            name: projectName,
            linter: Linter.EsLint,
            packageRunner,
        };
        await initPlaywrightGenerator(appTree, playwrightGeneratorSchema);

        const options: PlaywrightGeneratorSchema = {
            project: projectName,
            accessibility: false,
            visualRegression: 'none',
        };

        // run the generator twice to cause config to be re-updated
        await generator(appTree, options);
        await generator(appTree, options);

        const project = tsMorphTree(appTree);
        const projectConfigFile = project.addSourceFileAtPath(
            `${projectName}/playwright.config.ts`,
        );

        const projectConfigObject = projectConfigFile
            ?.getVariableDeclaration('config')
            .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

        // remove the first property of 'use' and it's expected that no other 'use' properties exist
        projectConfigObject.getProperty('use')?.remove();
        expect(projectConfigObject.getProperty('use')).toBeUndefined();

        const playwrightImport = projectConfigFile
            .getImportDeclarations()
            .find(
                importDeclaration =>
                    importDeclaration.getModuleSpecifier().getLiteralValue() ===
                    '@playwright/test',
            );
        let deviceImportsCount = 0;
        playwrightImport.getNamedImports().forEach(module => {
            if (module.getName() === 'devices') {
                deviceImportsCount += 1;
            }
        });
        expect(deviceImportsCount).toEqual(1);
    });

    it('should run successfully with accessibility enabled', async () => {
        const packageRunner: PackageRunner = 'npx';
        const playwrightGeneratorSchema: NxPlaywrightGeneratorSchema = {
            name: projectName,
            linter: Linter.EsLint,
            packageRunner,
        };
        await initPlaywrightGenerator(appTree, playwrightGeneratorSchema);
        const options: PlaywrightGeneratorSchema = {
            project: projectName,
            accessibility: true,
            visualRegression: 'none',
        };
        await generator(appTree, options);

        // axe-accessibility.spec.ts to be added
        expect(appTree.children(`${projectName}/src`)).toContain(
            'axe-accessibility.spec.ts',
        );

        // expect package.json updated
        const packageJson = JSON.parse(appTree.read('/package.json', 'utf-8'));
        expect(packageJson?.devDependencies).toMatchObject({
            '@axe-core/playwright': '4.5.2',
            'axe-result-pretty-print': '1.0.2',
        });
    });

    it('should run successfully with native regression', async () => {
        const packageRunner: PackageRunner = 'npx';
        const playwrightGeneratorSchema: NxPlaywrightGeneratorSchema = {
            name: projectName,
            linter: Linter.EsLint,
            packageRunner,
        };
        await initPlaywrightGenerator(appTree, playwrightGeneratorSchema);
        const options: PlaywrightGeneratorSchema = {
            project: projectName,
            accessibility: false,
            visualRegression: 'native',
        };
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

        const tasksYAML = YAML.parse(
            appTree.read('build/taskctl/tasks.yaml', 'utf-8'),
        );
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
    });

    it('should run successfully with applitools regression', async () => {
        const packageRunner: PackageRunner = 'npx';
        const playwrightGeneratorSchema: NxPlaywrightGeneratorSchema = {
            name: projectName,
            linter: Linter.EsLint,
            packageRunner,
        };
        await initPlaywrightGenerator(appTree, playwrightGeneratorSchema);
        const options: PlaywrightGeneratorSchema = {
            project: projectName,
            accessibility: false,
            visualRegression: 'applitools',
        };
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
    });

    it('should run successfully with accessibility and applitools regression', async () => {
        const packageRunner: PackageRunner = 'npx';
        const playwrightGeneratorSchema: NxPlaywrightGeneratorSchema = {
            name: projectName,
            linter: Linter.EsLint,
            packageRunner,
        };
        await initPlaywrightGenerator(appTree, playwrightGeneratorSchema);
        const options: PlaywrightGeneratorSchema = {
            project: projectName,
            accessibility: true,
            visualRegression: 'applitools',
        };
        await generator(appTree, options);

        // playwright-visual-regression.spec.ts to be added
        expect(appTree.children(`${projectName}/src`)).toContain(
            'applitools-eyes-grid.spec.ts',
        );

        // axe-accessibility.spec.ts to be added
        expect(appTree.children(`${projectName}/src`)).toContain(
            'axe-accessibility.spec.ts',
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
            '@axe-core/playwright': '4.5.2',
            'axe-result-pretty-print': '1.0.2',
        });
    });
});
