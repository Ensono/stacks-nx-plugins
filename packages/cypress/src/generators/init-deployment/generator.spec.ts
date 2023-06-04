import { readJson, Tree } from '@nrwl/devkit';
import YAML from 'yaml';

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries, import/no-relative-packages
import workspaceInitDeployment from '../../../../workspace/src/generators/init-deployment/generator';
import { createNextApp } from '../../utils/test-utils';
import generator from './generator';

const applicationName = 'application';

describe('cypress generator', () => {
    let appTree: Tree;

    beforeAll(async () => {
        appTree = await createNextApp(applicationName);
    });

    it('returns false if no prerequisite present', async () => {
        const gen = await generator(appTree);
        expect(gen).toBe(false);
    });

    describe('generator should manipulate deployment files as expected', () => {
        beforeAll(async () => {
            await workspaceInitDeployment(appTree, {
                pipelineRunner: 'taskctl',
            });
            await generator(appTree);
        });

        it('should update nx.json and tag executed generator true', async () => {
            const nxJson = readJson(appTree, 'nx.json');

            expect(
                nxJson.stacks.executedGenerators.workspace.includes(
                    'CypressInitDeployment',
                ),
            ).toBe(true);
        });

        it('should run successfully with default options', async () => {
            const taskctlYAML = YAML.parse(
                appTree.read('taskctl.yaml', 'utf8'),
            );
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
            const stages = YAML.parse(
                appTree.read('build/azDevOps/azuredevops-stages.yaml', 'utf8'),
            );

            expect(stages.stages[0]?.jobs[0]?.steps[5]).toEqual({
                task: 'Bash@3',
                condition:
                    "and(succeededOrFailed(),eq(variables.HASTESTRESULTS, 'true'))",
                displayName: 'Generate Reports',
                inputs: {
                    targetType: 'inline',
                    script: 'npx nx affected --base="$BASE_SHA" --target=html-report --configuration=ci --parallel=1',
                },
            });

            expect(stages.stages[0]?.jobs[0]?.steps[6]).toEqual({
                task: 'Bash@3',
                displayName: 'Check test-results Folder',
                condition: 'succeededOrFailed()',
                inputs: {
                    targetType: 'inline',
                    script:
                        'if [ -d $SYSTEM_DEFAULTWORKINGDIRECTORY/test-results ]; then\n' +
                        '  echo "##vso[task.setVariable variable=HASTESTRESULTS]true"\n' +
                        'fi',
                },
            });
            expect(stages.stages[0]?.jobs[0]?.steps[7]).toEqual({
                task: 'PublishTestResults@2',
                condition:
                    "and(succeededOrFailed(),eq(variables.HASTESTRESULTS, 'true'))",
                inputs: {
                    testResultsFormat: 'JUnit',
                    testResultsFiles: 'test-results/**/*.xml',
                },
            });
            expect(stages.stages[0]?.jobs[0]?.steps[8]).toEqual({
                task: 'PublishPipelineArtifact@1',
                condition:
                    "and(succeededOrFailed(),eq(variables.HASTESTRESULTS, 'true'))",
                inputs: {
                    targetPath:
                        '$(System.DefaultWorkingDirectory)/test-results',
                    artifact: 'testresults',
                    publishLocation: 'pipeline',
                },
            });
        });
    });
});
