import { joinPathFragments, ProjectConfiguration, Tree } from '@nx/devkit';

export function updateDockerfile(project: ProjectConfiguration, tree: Tree) {
    const filePath = joinPathFragments(project.root, 'Dockerfile');

    // Return if Dockerfile doesn't exist
    if (!tree.exists(filePath)) return;

    const customServer =
        project.targets?.['build-custom-server']?.options?.main;

    const rootFolderPath = project.targets?.build?.options?.root;
    const distributionFolderPath = project.targets?.build?.options?.outputPath;

    let customServerRelativePath: string;

    if (customServer) {
        customServerRelativePath = customServer
            .replace(`${rootFolderPath}/`, '')
            .replace('.ts', '.js');
    }

    const contents = tree.read(filePath).toString();

    if (!contents.includes(customServerRelativePath)) {
        const newContents = contents
            .replace(
                'CMD ["dumb-init", "node_modules/.bin/next", "start"]',
                `CMD ["dumb-init", "node", "${customServerRelativePath}"]`,
            )
            .replace(
                `COPY ${distributionFolderPath}/public ./public`,
                `COPY ${distributionFolderPath}/public ./public\nCOPY ${distributionFolderPath}/server ./server`,
            );
        tree.write(filePath, newContents);
    }
}
