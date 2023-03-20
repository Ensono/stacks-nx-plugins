import { Tree } from '@nrwl/devkit';
import YAML from 'yaml';

export function updateAzureDevopsStagesApplitools(tree: Tree) {
    if (tree.exists('build/azDevOps/azuredevops-stages.yaml')) {
        const stages = YAML.parse(
            tree.read('build/azDevOps/azuredevops-stages.yaml', 'utf8'),
        );
        if (!stages) {
            return;
        }

        const scriptIndex = stages?.stages[0]?.jobs[0]?.steps.findIndex(
            job => job?.task === 'AzureCLI@2',
        );

        if (
            scriptIndex &&
            stages?.stages[0]?.jobs[0]?.steps[scriptIndex]?.env
        ) {
            stages.stages[0].jobs[0].steps[scriptIndex].env = {
                ...stages?.stages[0]?.jobs[0]?.steps[scriptIndex].env,
                APPLITOOLS_API_KEY: '$(APPLITOOLS_API_KEY)',
            };
        }

        tree.write(
            'build/azDevOps/azuredevops-stages.yaml',
            YAML.stringify(stages),
        );
    }
}
