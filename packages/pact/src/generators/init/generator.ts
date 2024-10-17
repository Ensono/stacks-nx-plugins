import {
    addProjectConfiguration,
    formatFiles,
    generateFiles,
    Tree,
} from '@nx/devkit';
import path from 'path';

import { InitGeneratorSchema } from './schema';

// const root = `libs/${options.name}`;

export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
    const projectRoot = `./testOutput/${options.name}`;
    addProjectConfiguration(tree, options.name, {
        root: projectRoot,
        projectType: 'library',
        sourceRoot: `${projectRoot}/src`,
        targets: {},
    });
    generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
        name: options.name,
        consumerName: options.consumerName,
        providerName: options.providerName,
        projectAuthor: options.projectAuthor,
        endpointList: options.endpointList,
    });
    await formatFiles(tree);
}

export default initGenerator;
