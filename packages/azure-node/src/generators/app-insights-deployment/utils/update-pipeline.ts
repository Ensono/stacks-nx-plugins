import { Tree } from '@nrwl/devkit';
import YAML from 'yaml';

import { AppInsightsDeploymentGeneratorSchema } from '../schema';

export function updatePipelineStagesYaml(
    tree: Tree,
    options: AppInsightsDeploymentGeneratorSchema,
) {
    // Update values yaml
    const filePath = 'build/azDevOps/azuredevops-stages.yaml';

    // Skip if file doesn't exist
    if (!tree.exists(filePath)) return;

    const stagesYAML = YAML.parse(tree.read(filePath, 'utf-8'));

    // Find deployment step
    const stageIndex = stagesYAML.stages.findIndex(
        item => item.stage === `Build_\${{ parameters.environment }}`,
    );
    const jobIndex = stagesYAML.stages[stageIndex].jobs.findIndex(
        item => item.job === 'Build',
    );
    const stepIndex = stagesYAML.stages[stageIndex].jobs[
        jobIndex
    ].steps.findIndex(
        item =>
            item.displayName ===
            `build_deployment_\${{ parameters.environment }}`,
    );
    const deploymentStep =
        stagesYAML.stages[stageIndex].jobs[jobIndex].steps[stepIndex];

    // Create empty env if it doesn't already exist
    if (!deploymentStep.env) {
        deploymentStep.env = {};
    }

    deploymentStep.env[
        options.applicationinsightsConnectionString
    ] = `$(${options.applicationinsightsConnectionString})`;

    tree.write(filePath, YAML.stringify(stagesYAML));
}
