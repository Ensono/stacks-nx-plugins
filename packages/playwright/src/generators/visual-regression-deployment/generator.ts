import {
    hasGeneratorExecutedForWorkspace,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import { formatFiles, Tree, logger } from '@nx/devkit';

import { VisualRegressionDeploymentGeneratorSchema } from './schema';
import { updateAzureDevopsStagesApplitools } from './utils/update-azdevops-stage';
import { updateAzureDevopsSnapshotsYaml } from './utils/update-azure-devops-updatesnapshots';
import { updateTaskctlYaml, updateTasksYaml } from './utils/update-tasks-yamls';
import { visualRegressionTypes } from '../../utils/types';

// eslint-disable-next-line consistent-return
export default async function visualRegressionDeploymentGenerator(
    tree: Tree,
    options: VisualRegressionDeploymentGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree);

    if (
        hasGeneratorExecutedForWorkspace(
            tree,
            'PlaywrightVisualRegressionDeployment',
            true,
        )
    )
        return false;

    switch (options.type) {
        case visualRegressionTypes.NATIVE: {
            // update tasks.yaml
            updateTasksYaml(tree);
            // update taskctl.yaml
            updateTaskctlYaml(tree, { visualRegression: true });

            updateAzureDevopsSnapshotsYaml(tree);
            break;
        }
        case visualRegressionTypes.APPLITOOLS: {
            updateAzureDevopsStagesApplitools(tree);

            logger.warn(`Don't forget to set your 'APPLITOOLS_API_KEY'.`);
            break;
        }
        default: {
            await formatFiles(tree);
        }
    }
}
