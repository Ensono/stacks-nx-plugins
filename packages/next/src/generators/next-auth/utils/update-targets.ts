import {
    joinPathFragments,
    ProjectConfiguration,
    Tree,
    updateJson,
} from '@nrwl/devkit';

export function updateProjectJsonHelmUpgradeTarget(
    project: ProjectConfiguration,
    tree: Tree,
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
                const defaultCommand =
                    helmUpgradeTarget.options.commands[defaultCommandIndex];

                const prodCommandIndex =
                    helmUpgradeTarget.configurations.prod.commands.findIndex(
                        (command: any) =>
                            command.command.includes('helm upgrade'),
                    );
                const prodCommand =
                    helmUpgradeTarget.configurations.prod.commands[
                        prodCommandIndex
                    ];

                // Check if command doesn't have redisURL already
                if (!defaultCommand.command.includes('redisURL')) {
                    // Update command
                    updatedProjectJson.targets['helm-upgrade'].options.commands[
                        defaultCommandIndex
                    ] = {
                        ...defaultCommand,
                        command: `${defaultCommand.command} --set redisURL=$(terraform output -raw redis_connection_string)`,
                    };
                }

                // Check if command doesn't have nextAuthSecret already
                if (!defaultCommand.command.includes('nextAuthSecret')) {
                    // Update command
                    updatedProjectJson.targets['helm-upgrade'].options.commands[
                        defaultCommandIndex
                    ] = {
                        ...defaultCommand,
                        command: `${defaultCommand.command} --set nextAuthSecret=\\"$NEXTAUTH_SECRET\\"`,
                    };
                }

                // Check if command doesn't have redisURL already
                if (!prodCommand.command.includes('redisURL')) {
                    // Update command
                    updatedProjectJson.targets[
                        'helm-upgrade'
                    ].configurations.prod.commands[prodCommandIndex] = {
                        ...prodCommand,
                        command: `${prodCommand.command} --set redisURL=$(terraform output -raw redis_connection_string)`,
                    };
                }

                // Check if command doesn't have nextAuthSecret already
                if (!prodCommand.command.includes('nextAuthSecret')) {
                    // Update command
                    updatedProjectJson.targets[
                        'helm-upgrade'
                    ].configurations.prod.commands[prodCommandIndex] = {
                        ...prodCommand,
                        command: `${prodCommand.command} --set nextAuthSecret=\\"$NEXTAUTH_SECRET\\"`,
                    };
                }

                // Check if dependsOn already defined for helm upgrade
                if (!helmUpgradeTarget.dependsOn) {
                    updatedProjectJson.targets['helm-upgrade'].dependsOn = [];
                }

                if (
                    !updatedProjectJson.targets[
                        'helm-upgrade'
                    ].dependsOn.includes('terraform-init')
                ) {
                    updatedProjectJson.targets['helm-upgrade'].dependsOn = [
                        ...new Set([
                            ...helmUpgradeTarget.dependsOn,
                            'terraform-init',
                        ]),
                    ];
                }
            }

            return updatedProjectJson;
        },
    );
}
