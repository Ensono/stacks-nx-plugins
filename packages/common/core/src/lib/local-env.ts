import {
    joinPathFragments,
    names,
    ProjectConfiguration,
    Tree,
} from '@nx/devkit';

/**
 * Write variables into .env.local file either for specific project
 * or at the root of the workspace.
 *
 * @param project Passing undefined will add .env.local in workspace root.
 * @param tree Workspace tree.
 * @param parameters Key value pairs to be written into .env.local. If key already
 *                   exists then it won't be overwritten.
 */
export function createOrUpdateLocalEnv(
    project: ProjectConfiguration | undefined,
    tree: Tree,
    parameters: Record<string, string>,
) {
    const localEnvPath = joinPathFragments(project?.root ?? '', '.env.local');

    const env = Object.entries(parameters).map(([key, value]) => [
        key.toLocaleUpperCase() !== key ? names(key).constantName : key,
        value,
    ]);

    if (!tree.exists(localEnvPath)) {
        tree.write(localEnvPath, env.map(entry => entry.join('=')).join('\n'));
    } else {
        let localEnv = tree.read(localEnvPath)?.toString().trim() ?? '';
        env.forEach(([key, value]) => {
            if (!localEnv.includes(`${key}=`)) {
                localEnv += `\n${key}=${value}`;
            }
        });
        tree.write(localEnvPath, localEnv);
    }
}
