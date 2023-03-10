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
                const prodCommandIndex =
                    helmUpgradeTarget.configurations.prod.commands.findIndex(
                        (command: any) =>
                            command.command.includes('helm upgrade'),
                    );

                // Read latest update each time
                const getUpdatedDefaultCommand = () =>
                    helmUpgradeTarget.options.commands[defaultCommandIndex];
                const getUpdatedProdCommand = () =>
                    helmUpgradeTarget.configurations.prod.commands[
                        prodCommandIndex
                    ];

                const defaultCommand = getUpdatedDefaultCommand();
                const prodCommand = getUpdatedProdCommand();

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
                    const updatedCommand = getUpdatedDefaultCommand();
                    // Update command
                    updatedProjectJson.targets['helm-upgrade'].options.commands[
                        defaultCommandIndex
                    ] = {
                        ...updatedCommand,
                        command: `${updatedCommand.command} --set nextAuthSecret="$NEXTAUTH_SECRET"`,
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
                    const updatedCommand = getUpdatedProdCommand();
                    // Update command
                    updatedProjectJson.targets[
                        'helm-upgrade'
                    ].configurations.prod.commands[prodCommandIndex] = {
                        ...updatedCommand,
                        command: `${updatedCommand.command} --set nextAuthSecret="$NEXTAUTH_SECRET"`,
                    };
                }
            }

            return updatedProjectJson;
        },
    );
}
