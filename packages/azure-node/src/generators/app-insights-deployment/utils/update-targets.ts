import {
    joinPathFragments,
    ProjectConfiguration,
    Tree,
    updateJson,
} from '@nrwl/devkit';

import { AppInsightsDeploymentGeneratorSchema } from '../schema';

export function updateProjectJsonHelmUpgradeTarget(
    project: ProjectConfiguration,
    tree: Tree,
    options: AppInsightsDeploymentGeneratorSchema,
) {
    updateJson(
        tree,
        joinPathFragments(project.root, 'project.json'),
        projectJson => {
            const updatedProjectJson = { ...projectJson };
            const helmUpgradeTarget = projectJson.targets['helm-upgrade'];

            // Check if target exist
            if (helmUpgradeTarget) {
                const defaultCommandIndex =
                    helmUpgradeTarget.options.commands.findIndex(
                        (command: any) =>
                            command.command.includes('helm upgrade'),
                    );

                // Read latest update each time
                const getUpdatedDefaultCommand = () =>
                    helmUpgradeTarget.options.commands[defaultCommandIndex];

                const defaultCommand = getUpdatedDefaultCommand();

                // Check if command doesn't have env.${options.applicationinsightsConnectionString} already
                if (
                    !defaultCommand.command.includes(
                        `env.${options.applicationinsightsConnectionString}`,
                    )
                ) {
                    // Update command
                    updatedProjectJson.targets['helm-upgrade'].options.commands[
                        defaultCommandIndex
                    ] = {
                        ...defaultCommand,
                        command: `${defaultCommand.command} --set env.${options.applicationinsightsConnectionString}=$${options.applicationinsightsConnectionString}`,
                    };
                }
            }

            return updatedProjectJson;
        },
    );
}
