import {
    Tree,
    generateFiles,
    readJson,
    NxJsonStacksConfiguration,
} from '@nx/devkit';
import path from 'path';
import * as YAML from 'yaml';

export function updateAzureDevopsSnapshotsYaml(tree: Tree) {
    if (
        tree.exists('build/azDevOps/azuredevops-stages.yaml') &&
        !tree.exists('build/azDevOps/azuredevops-updatesnapshots.yaml')
    ) {
        generateFiles(
            tree,
            path.join(__dirname, '..', 'files', 'native-build'),
            path.join('build', 'azDevOps'),
            {},
        );
    }

    // update values from nx.json
    if (tree.exists('build/azDevOps/azuredevops-updatesnapshots.yaml')) {
        const updateSnapshotsYAML = YAML.parse(
            tree.read(
                path.join(
                    'build',
                    'azDevOps',
                    'azuredevops-updatesnapshots.yaml',
                ),
                'utf8',
            ),
        );
        const nxJsonStacks = readJson(tree, 'nx.json')
            .stacks as NxJsonStacksConfiguration;
        updateSnapshotsYAML.variables[1] = {
            group: `${nxJsonStacks.config.business.company}-${nxJsonStacks.config.business.domain}-${nxJsonStacks.config.business.component}-common`,
        };
        updateSnapshotsYAML.variables[3] = {
            group: `${nxJsonStacks.config.business.company}-${nxJsonStacks.config.business.domain}-${nxJsonStacks.config.business.component}-nonprod`,
        };
        tree.write(
            'build/azDevOps/azuredevops-updatesnapshots.yaml',
            YAML.stringify(updateSnapshotsYAML),
        );
    }
}
