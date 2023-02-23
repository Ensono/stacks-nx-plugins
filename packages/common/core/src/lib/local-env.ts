import {
    joinPathFragments,
    names,
    ProjectConfiguration,
    Tree,
} from '@nrwl/devkit';

export function createOrUpdateLocalEnv(
    project: ProjectConfiguration,
    tree: Tree,
    parameters: Record<string, string>,
) {
    const localEnvPath = joinPathFragments(project.root, '.env.local');

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
