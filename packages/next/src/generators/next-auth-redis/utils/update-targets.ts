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

                // Read latest update each time
                const getUpdatedDefaultCommand = () =>
                    helmUpgradeTarget.options.commands[defaultCommandIndex];
                const getUpdatedDefaultArgs = () =>
                    helmUpgradeTarget.options.args;
                const getUpdatedProdArgs = () =>
                    helmUpgradeTarget.configurations.prod.args;

                const defaultCommand = getUpdatedDefaultCommand();
                const defaultArgs = getUpdatedDefaultArgs();
                const prodArgs = getUpdatedProdArgs();

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
                if (!defaultArgs.includes('--terraform-dir')) {
                    const updatedArgs = getUpdatedDefaultArgs();
                    // Update args
                    updatedProjectJson.targets['helm-upgrade'].options.args = `${updatedArgs} --terraform-dir=-chdir=../../../build/terraform`;
                }
               
                // Check if args doesn't have terraform-dir already
                if (!prodArgs.includes('--terraform-dir')) {
                    const updatedArgs = getUpdatedProdArgs();
                    // Update args
                    updatedProjectJson.targets['helm-upgrade'].configurations.prod.args = `${updatedArgs} --terraform-dir=-chdir=../../../build/terraform`;
                }

                // Check if args doesn't have --values redis.yaml already
                if (!defaultArgs.includes('--values redis.yaml')) {
                    const updatedArgs = getUpdatedDefaultArgs();
                    const currentValues = updatedArgs.match(/--values-files='([^']+)'/)[1];
                    const newValues = `${currentValues} --values redis.yaml`
                    // Update args
                    updatedProjectJson.targets['helm-upgrade'].options.args = updatedArgs.replace(currentValues, newValues);
                }
               
                // Check if args doesn't have --values redis.yaml already
                if (!prodArgs.includes('--values redis.yaml')) {
                    const updatedArgs = getUpdatedProdArgs();
                    const currentValues = updatedArgs.match(/--values-files='([^']+)'/)[1];
                    const newValues = `${currentValues} --values redis.yaml`
                    // Update args
                    updatedProjectJson.targets['helm-upgrade'].configurations.prod.args = updatedArgs.replace(currentValues, newValues);
                }

            
            }

            return updatedProjectJson;
        },
    );
}
