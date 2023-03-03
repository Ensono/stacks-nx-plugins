import { tsMorphTree } from '@ensono-stacks/core';
import { joinPathFragments, readJson, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { SyntaxKind } from 'ts-morph';
import YAML from 'yaml';

import generator from './generator';
import { PlaywrightGeneratorSchema } from './schema';

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
                            sourceRoot: `${projectName}`,
                            name: 'test',
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
                        { task: 'version', depends_on: 'build' },
                        { task: 'terraform', depends_on: 'version' },
                        { task: 'helm', depends_on: 'terraform' },
                    ],
                    fe: [
                        { task: 'lint' },
                        { task: 'build', depends_on: 'lint' },
                        { task: 'version', depends_on: 'build' },
                    ],
                    nonprod: [
                        { task: 'lint:ci' },
                        { task: 'build:ci', depends_on: 'lint:ci' },
                        { task: 'test:ci', depends_on: 'build:ci' },
                        { task: 'version:nonprod', depends_on: 'test:ci' },
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
                        { task: 'version:prod', depends_on: 'test:ci' },
                        { task: 'terraform:prod', depends_on: 'version:prod' },
                        { task: 'helm:prod', depends_on: 'terraform:prod' },
                    ],
                },
            }),
        );
        appTree.write('build/tasks.yaml', YAML.stringify({ tasks: {} }));
    });

    afterEach(() => {
        appTree.delete('taskctl.yaml');
        appTree.delete('build/tasks.yaml');
    });

    it('should error if the project already exists', async () => {
        const options: PlaywrightGeneratorSchema = {
            project: `${projectName}`,
        };

        await generator(appTree, options);
        await expect(generator(appTree, options)).rejects.toThrowError(
            `Cannot create a new project ${projectNameE2E} at ./${projectNameE2E}. It already exists.`,
        );
    }, 100_000);

    it('should run successfully with default options', async () => {
        const options: PlaywrightGeneratorSchema = {
            project: projectName,
        };
        await generator(appTree, options);

        // example.spec.ts to be added
        expect(appTree.children(`${projectNameE2E}/src`)).toContain(
            'example.spec.ts',
        );

        // app.spec.ts to be removed
        expect(appTree.children(`${projectNameE2E}/src`)).not.toContain(
            'app.spec.ts',
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
            `${projectNameE2E}/playwright.config.ts`,
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

        const taskctlYAML = YAML.parse(appTree.read('taskctl.yaml', 'utf8'));
        expect(taskctlYAML.pipelines.dev).toContainEqual({
            task: 'e2e:ci',
            depends_on: 'build',
        });
        expect(taskctlYAML.pipelines.fe).toContainEqual({
            task: 'e2e:ci',
            depends_on: 'build',
        });
        expect(taskctlYAML.pipelines.nonprod).toContainEqual({
            task: 'e2e:ci',
            depends_on: 'test:ci',
        });
        expect(taskctlYAML.pipelines.prod).toContainEqual({
            task: 'e2e:ci',
            depends_on: 'test:ci',
        });

        // Add infra tasks
        const projectJson = readJson(
            appTree,
            joinPathFragments(projectNameE2E, 'project.json'),
        );
        expect(projectJson.targets.e2e).toBeTruthy();
    }, 100_000);

    it('should alter azure devops stages file that is generated by workspace', async () => {
        appTree.write(
            'build/azDevOps/azuredevops-stages.yaml',
            `parameters:
  - name: azureSubscription
    type: string
    default: cake
  - name: containerRegistry
    type: string
    default: amidostacksnonprodeuwcore.azurecr.io
  - name: aksResourceGroup
    type: string
    default: amido-stacks-nonprod-euw-core
  - name: aksName
    type: string
    default: amido-stacks-nonprod-euw-core
  - name: environment
    type: string
    default: nonprod

# Configure the stages
stages:
  - stage: Build_\${{ parameters.environment }}
    jobs:
      - job: Build
        steps:
          # Install Taskctl for the build to run
          - checkout: 'self'
            fetchDepth: '0'
            persistCredentials: 'true'
          - task: Bash@3
            displayName: Install Taskctl
            inputs:
              targetType: inline
              script: |
                wget https://github.com/taskctl/taskctl/releases/download/$(TaskctlVersion)/taskctl_$(TaskctlVersion)_linux_amd64.tar.gz -O /tmp/taskctl.tar.gz
                tar zxf /tmp/taskctl.tar.gz -C /usr/local/bin taskctl
          # Install the stacks envfile
          - task: Bash@3
            displayName: Install Envfile
            inputs:
              targetType: inline
              script: |
                wget https://github.com/amido/stacks-envfile/releases/download/v$(StacksEnvfileVersion)/stacks-envfile-linux-amd64-$(StacksEnvfileVersion) -O /usr/local/bin/envfile
                chmod +x /usr/local/bin/envfile
          - script: |
              npm ci
              git config --global user.email "pipelines@test.dev"
              git config --global user.name "Amido Pipelines"
          - task: AzureCLI@2
            displayName: build_deployment_\${{ parameters.environment }}
            env:
              GH_TOKEN: $(GH_TOKEN)
            inputs:
              azureSubscription: \${{ parameters.azureSubscription }}
              scriptLocation: inlineScript
              scriptType: bash
              addSpnToEnvironment: true
              inlineScript: |
                echo $servicePrincipalKey | docker login \${{ parameters.containerRegistry }} -u $servicePrincipalId --password-stdin
                echo $servicePrincipalKey | helm registry login \${{ parameters.containerRegistry }} --username $servicePrincipalId --password-stdin
                az aks get-credentials --admin -n \${{ parameters.aksName }} -g \${{ parameters.aksResourceGroup }}
                export ARM_CLIENT_ID=$servicePrincipalId
                export ARM_CLIENT_SECRET=$servicePrincipalKey
                export ARM_TENANT_ID=$tenantId
                export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
                taskctl \${{ parameters.environment }}

`,
        );
        const options: PlaywrightGeneratorSchema = {
            project: projectName,
        };
        await generator(appTree, options);

        const stages = YAML.parse(
            appTree.read('build/azDevOps/azuredevops-stages.yaml', 'utf8'),
        );

        expect(stages.stages[0]?.jobs[0]?.steps[3]).toEqual({
            script:
                'npm ci\n' +
                'git config --global user.email "pipelines@test.dev"\n' +
                'git config --global user.name "Amido Pipelines"\n' +
                'npx playwright install --with-deps',
        });
        expect(stages.stages[0]?.jobs[0]?.steps[5]).toEqual({
            task: 'PublishTestResults@2',
            condition: 'succeededOrFailed()',
            inputs: {
                testResultsFormat: 'JUnit',
                testResultsFiles: 'test-results/**/*.xml',
            },
        });
        expect(stages.stages[0]?.jobs[0]?.steps[6]).toEqual({
            task: 'PublishPipelineArtifact@1',
            condition: 'succeededOrFailed()',
            inputs: {
                targetPath: '$(System.DefaultWorkingDirectory)/test-results',
                artifact: 'testresults',
                publishLocation: 'pipeline',
            },
        });
    });
});
