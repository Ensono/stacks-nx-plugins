import {
    joinPathFragments,
    ProjectConfiguration,
    Tree,
    updateJson,
} from '@nx/devkit';

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

                // Read latest update each time
                const getUpdatedDefaultCommand = () =>
                    helmUpgradeTarget.options.commands[defaultCommandIndex];
                const getUpdatedDefaultArguments = () =>
                    helmUpgradeTarget.options.args;
                const getUpdatedProdArguments = () =>
                    helmUpgradeTarget.configurations.prod.args;

                const defaultCommand = getUpdatedDefaultCommand();
                const defaultArguments = getUpdatedDefaultArguments();
                const prodArguments = getUpdatedProdArguments();

                // Check if command doesn't have env.REDIS_URL already
                if (!defaultCommand.command.includes('env.REDIS_URL')) {
                    // Update command
                    updatedProjectJson.targets['helm-upgrade'].options.commands[
                        defaultCommandIndex
                    ] = {
                        ...defaultCommand,
                        command: `${defaultCommand.command} --set env.REDIS_URL=$(terraform {args.terraform-dir} output -raw redis_connection_string)`,
                    };
                }

                // Check if command doesn't have env.NEXTAUTH_SECRET already
                if (!defaultCommand.command.includes('env.NEXTAUTH_SECRET')) {
                    const updatedCommand = getUpdatedDefaultCommand();
                    // Update command
                    updatedProjectJson.targets['helm-upgrade'].options.commands[
                        defaultCommandIndex
                    ] = {
                        ...updatedCommand,
                        command: `${updatedCommand.command} --set env.NEXTAUTH_SECRET="$NEXTAUTH_SECRET"`,
                    };
                }

                // Check if args doesn't have terraform-dir already
                if (!defaultArguments.includes('--terraform-dir')) {
                    const updatedArguments = getUpdatedDefaultArguments();
                    // Update args
                    updatedProjectJson.targets[
                        'helm-upgrade'
                    ].options.args = `${updatedArguments} --terraform-dir=-chdir=../../terraform`;
                }

                // Check if args doesn't have terraform-dir already
                if (!prodArguments.includes('--terraform-dir')) {
                    const updatedArguments = getUpdatedProdArguments();
                    // Update args
                    updatedProjectJson.targets[
                        'helm-upgrade'
                    ].configurations.prod.args = `${updatedArguments} --terraform-dir=-chdir=../../terraform`;
                }

                // Check if args doesn't have --values redis.yaml already
                if (!defaultArguments.includes('--values redis.yaml')) {
                    const updatedArguments = getUpdatedDefaultArguments();
                    const currentValues = updatedArguments.match(
                        /--values-files='([^']+)'/,
                    )[1];
                    const newValues = `${currentValues} --values redis.yaml`;
                    // Update args
                    updatedProjectJson.targets['helm-upgrade'].options.args =
                        updatedArguments.replace(currentValues, newValues);
                }

                // Check if args doesn't have --values redis.yaml already
                if (!prodArguments.includes('--values redis.yaml')) {
                    const updatedArguments = getUpdatedProdArguments();
                    const currentValues = updatedArguments.match(
                        /--values-files='([^']+)'/,
                    )[1];
                    const newValues = `${currentValues} --values redis.yaml`;
                    // Update args
                    updatedProjectJson.targets[
                        'helm-upgrade'
                    ].configurations.prod.args = updatedArguments.replace(
                        currentValues,
                        newValues,
                    );
                }
            }

            return updatedProjectJson;
        },
    );
}

export function updateProjectJsonTerraformPlanTarget(
    project: ProjectConfiguration,
    tree: Tree,
) {
    updateJson(
        tree,
        joinPathFragments(project.root, 'project.json'),
        projectJson => {
            const updatedProjectJson = { ...projectJson };
            const terraformPlanTarget = projectJson.targets['terraform-plan'];

            // Check if target exist
            if (terraformPlanTarget) {
                // Read latest update each time
                const getUpdatedDefaultArguments = () =>
                    terraformPlanTarget.options.args;
                const getUpdatedProdArguments = () =>
                    terraformPlanTarget.configurations.prod.args;

                const defaultArguments = getUpdatedDefaultArguments();
                const prodArguments = getUpdatedProdArguments();

                // Check if args doesn't have -var-file=variables/nonprod/redis.tfvars already
                if (
                    !defaultArguments.includes(
                        '-var-file=variables/nonprod/redis.tfvars',
                    )
                ) {
                    const updatedArguments = getUpdatedDefaultArguments();
                    const currentVariables = updatedArguments.match(
                        /--terraform='([^']+)'/,
                    )[1];
                    const newVariables = `${currentVariables} -var-file=variables/nonprod/redis.tfvars`;
                    // Update args
                    updatedProjectJson.targets['terraform-plan'].options.args =
                        updatedArguments.replace(
                            currentVariables,
                            newVariables,
                        );
                }

                // Check if args doesn't have -var-file=variables/prod/redis.tfvars already
                if (
                    !prodArguments.includes(
                        '-var-file=variables/prod/redis.tfvars',
                    )
                ) {
                    const updatedArguments = getUpdatedProdArguments();
                    const currentVariables = updatedArguments.match(
                        /--terraform='([^']+)'/,
                    )[1];
                    const newVariables = `${currentVariables} -var-file=variables/prod/redis.tfvars`;
                    // Update args
                    updatedProjectJson.targets[
                        'terraform-plan'
                    ].configurations.prod.args = updatedArguments.replace(
                        currentVariables,
                        newVariables,
                    );
                }
            }

            return updatedProjectJson;
        },
    );
}
