import { testUpdateStacksConfig } from '@ensono-stacks/core';
import { readJson, Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import YAML from 'yaml';

import generator from './generator';

describe('playwright generator', () => {
    let appTree: Tree;

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();

        testUpdateStacksConfig(appTree, '');

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

    it('should run successfully with default options', async () => {
        await generator(appTree);

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
        await generator(appTree);

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

    describe('executedGenerators', () => {
        it('should update nx.json and tag executed generator true', async () => {
            await generator(appTree);

            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.workspace.includes(
                    'PlaywrightInitDeployment',
                ),
            ).toBeTruthy();
            expect(
                nxJson.stacks.executedGenerators.workspace.includes(
                    'PlaywrightInitDeployment',
                ),
            ).toBe(true);
        });

        it('should return false from method and exit generator if already executed', async () => {
            await generator(appTree);

            updateJson(appTree, 'nx.json', nxJson => ({
                ...nxJson,
                stacks: {
                    ...nxJson.stacks,
                    executedGenerators: {
                        workspace: ['PlaywrightInitDeployment'],
                    },
                },
            }));

            const gen = await generator(appTree);

            expect(gen).toBe(false);
        });
    });
});
