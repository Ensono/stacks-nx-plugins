import {
    Tree,
    generateFiles,
    readJson,
    NxJsonConfiguration,
} from '@nrwl/devkit';
import path from 'path';
import YAML from 'yaml';

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
                'utf-8',
            ),
        );
        const nxJson = readJson(tree, 'nx.json') as NxJsonConfiguration;
        updateSnapshotsYAML.variables[1] = {
            group: `${nxJson.stacks.business.company}-${nxJson.stacks.business.domain}-${nxJson.stacks.business.component}-common`,
        };
        updateSnapshotsYAML.variables[3] = {
            group: `${nxJson.stacks.business.company}-${nxJson.stacks.business.domain}-${nxJson.stacks.business.component}-nonprod`,
        };
        tree.write(
            'build/azDevOps/azuredevops-updatesnapshots.yaml',
            YAML.stringify(updateSnapshotsYAML),
        );
    }
}
