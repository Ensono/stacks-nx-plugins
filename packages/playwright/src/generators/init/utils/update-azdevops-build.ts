import { Tree } from '@nrwl/devkit';
import YAML from 'yaml';

export function updateAzureDevopsStages(tree: Tree) {
    if (!tree.exists('build/azDevOps/azuredevops-stages.yaml')) {
        return;
    }

    const stages = YAML.parse(
        tree.read('build/azDevOps/azuredevops-stages.yaml', 'utf8'),
    );
    if (!stages) {
        return;
    }
    const scriptIndex = stages.stages[0]?.jobs[0]?.steps.findIndex(
        job =>
            job?.script ===
            'npm ci\n' +
                'git config --global user.email "pipelines@test.dev"\n' +
                'git config --global user.name "Amido Pipelines"\n',
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
        task: 'PublishTestResults@2',
        condition: 'succeededOrFailed()',
        inputs: {
            testResultsFormat: 'JUnit',
            testResultsFiles: 'test-results/**/*.xml',
        },
    });

    stages?.stages[0]?.jobs[0]?.steps.push({
        task: 'PublishPipelineArtifact@1',
        condition: 'succeededOrFailed()',
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