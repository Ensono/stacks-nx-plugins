import { Tree } from '@nx/devkit';
import YAML from 'yaml';

export function updateAzureDevopsStages(tree: Tree) {
    if (tree.exists('build/azDevOps/azuredevops-stages.yaml')) {
        const stages = YAML.parse(
            tree.read('build/azDevOps/azuredevops-stages.yaml', 'utf8'),
        );
        if (!stages) {
            return;
        }
        const scriptIndex = stages?.stages[0]?.jobs[0]?.steps.findIndex(
            job =>
                job?.script?.includes('npm ci') &&
                job?.script?.includes('git config --global user.email') &&
                job?.script?.includes('git config --global user.name'),
        );

        if (scriptIndex && stages?.stages[0]?.jobs[0]?.steps[scriptIndex]) {
            stages.stages[0].jobs[0].steps[scriptIndex] = {
                script:
                    'npm ci\n' +
                    'git config --global user.email "pipelines@test.dev"\n' +
                    'git config --global user.name "Amido Pipelines"\n' +
                    'npx playwright install --with-deps',
            };
        }

        stages?.stages[0]?.jobs[0]?.steps.push({
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

        stages?.stages[0]?.jobs[0]?.steps.push({
            task: 'PublishTestResults@2',
            condition:
                "and(succeededOrFailed(),eq(variables.HASTESTRESULTS, 'true'))",
            inputs: {
                testResultsFormat: 'JUnit',
                testResultsFiles: 'test-results/**/*.xml',
            },
        });

        stages?.stages[0]?.jobs[0]?.steps.push({
            task: 'PublishPipelineArtifact@1',
            condition:
                "and(succeededOrFailed(),eq(variables.HASTESTRESULTS, 'true'))",
            inputs: {
                targetPath: '$(System.DefaultWorkingDirectory)/test-results',
                artifact: 'testresults',
                publishLocation: 'pipeline',
            },
        });

        tree.write(
            'build/azDevOps/azuredevops-stages.yaml',
            YAML.stringify(stages),
        );
    }
}
