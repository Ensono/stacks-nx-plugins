import {
    joinPathFragments,
    logger, readProjectConfiguration,
    Tree,
} from '@nx/devkit';
import { ReactQueryGeneratorSchema } from './schema';
import {
    formatFiles,
    formatFilesWithEslint,
    hasGeneratorExecutedForProject,
    tsMorphTree,
    verifyPluginCanBeInstalled
} from "@ensono-stacks/core";
import {addSessionProviderToApp} from "../next-auth/utils/session-provider";
import {runTasksInSerial} from "@nx/workspace/src/utilities/run-tasks-in-serial";
import {installDependencies} from "../next-auth/utils/dependencies";

export async function reactQueryGenerator(
    tree: Tree,
    options: ReactQueryGeneratorSchema,
) {
    verifyPluginCanBeInstalled(tree, options.project);

    if (hasGeneratorExecutedForProject(tree, options.project, 'ReactQuery', true))
        return false;

    const project = readProjectConfiguration(tree, options.project);

    const morphTree = tsMorphTree(tree);

    addSessionProviderToApp(project, morphTree);

    await formatFiles(tree, [joinPathFragments(project.root, 'build', 'helm', '**', '*.yaml'),])

    return runTasksInSerial(
        options.skipPackageJson ? () => {} : installDependencies(tree),
        formatFilesWithEslint(options.project),
        () => {
            logger.warn(`ops.`);
        },
    );
}

export default reactQueryGenerator;
