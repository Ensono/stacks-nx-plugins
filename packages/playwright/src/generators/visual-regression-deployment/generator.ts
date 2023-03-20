import { formatFiles, Tree } from '@nrwl/devkit';
import chalk from 'chalk';

import { visualRegressionTypes } from '../../utils/types';
import { VisualRegressionDeploymentGeneratorSchema } from './schema';
import { updateAzureDevopsStagesApplitools } from './utils/update-azdevops-stage';
import { updateAzureDevopsSnapshotsYaml } from './utils/update-azure-devops-updatesnapshots';
import { updateTaskctlYaml, updateTasksYaml } from './utils/update-tasks-yamls';

export default async function visualRegressionDeploymentGenerator(
    tree: Tree,
    options: VisualRegressionDeploymentGeneratorSchema,
) {
    switch (options.visualRegression) {
        case visualRegressionTypes.NATIVE:
            // update tasks.yaml
            updateTasksYaml(tree);
            // update taskctl.yaml
            updateTaskctlYaml(tree, { visualRegression: true });

            updateAzureDevopsSnapshotsYaml(tree);
            break;
        case visualRegressionTypes.APPLITOOLS:
            updateAzureDevopsStagesApplitools(tree);

            console.warn(
                chalk.yellow`Don't forget to set your 'APPLITOOLS_API_KEY'.`,
            );
            break;
        default:
            await formatFiles(tree);
    }
}
