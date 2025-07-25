import path from 'path';

import {
    ProjectConfiguration,
    Tree,
    generateFiles,
    readNxJson,
} from '@nx/devkit';

import { getPort } from './project-targets';

export function addFiles(tree: Tree, project: ProjectConfiguration) {
    const customServer = project.targets?.['build-custom-server'];

    const nxJson = readNxJson(tree);
    const hasPlugin = nxJson.plugins?.some(p =>
        typeof p === 'string'
            ? p === '@nx/next/plugin'
            : p.plugin === '@nx/next/plugin',
    );

    const distributionFolderPath = hasPlugin
        ? `dist/${project.root}`
        : project.targets?.build?.options?.outputPath;
    const sourceRoot = project?.sourceRoot;

    const port = getPort(project);

    let customServerRelativePath: string;

    if (customServer?.options?.main) {
        customServerRelativePath = customServer?.options?.main
            .replace(`${sourceRoot}/`, '')
            .replace('.ts', '.js');
    }

    generateFiles(
        tree,
        path.join(__dirname, '..', 'files', 'common'),
        project.root,
        {
            distFolderPath: distributionFolderPath,
            customServerRelativePath,
            port,
            projectName: project.name,
            template: '',
        },
    );

    if (customServer) {
        generateFiles(
            tree,
            path.join(__dirname, '..', 'files', 'custom-server'),
            project.root,
            {
                port,
                projectRoot: project.root,
                template: '',
            },
        );
    }

    return () => {};
}
