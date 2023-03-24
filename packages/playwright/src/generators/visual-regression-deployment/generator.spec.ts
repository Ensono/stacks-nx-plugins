import { Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import YAML from 'yaml';

import generator from './generator';
import { VisualRegressionDeploymentGeneratorSchema } from './schema';

describe('visual-regression-deployment generator', () => {
    let appTree: Tree;

    beforeEach(() => {
        appTree = createTreeWithEmptyWorkspace();

        appTree.write(
            'taskctl.yaml',
            YAML.stringify({
                pipelines: {
                    dev: [
                        { task: 'lint' },
                        { task: 'build', depends_on: 'lint' },
                        { task: 'e2e:ci', depends_on: 'build' },
                        { task: 'version', depends_on: 'e2e:ci' },
                        { task: 'terraform', depends_on: 'version' },
                        { task: 'helm', depends_on: 'terraform' },
                    ],
                    fe: [
                        { task: 'lint' },
                        { task: 'build', depends_on: 'lint' },
                        { task: 'e2e:ci', depends_on: 'build' },
                        { task: 'version', depends_on: 'e2e:ci' },
                    ],
                    nonprod: [
                        { task: 'lint:ci' },
                        { task: 'build:ci', depends_on: 'lint:ci' },
                        { task: 'test:ci', depends_on: 'build:ci' },
                        { task: 'e2e:ci', depends_on: 'test:ci' },
                        { task: 'version:nonprod', depends_on: 'e2e:ci' },
                        {
                            task: 'terraform:nonprod',
                            depends_on: 'version:nonprod',
                        },
                        {
                            task: 'helm:nonprod',
                            depends_on: 'terraform:nonprod',
                        },
                    ],
                    prod: [
                        { task: 'build:ci' },
                        { task: 'test:ci', depends_on: 'build:ci' },
                        { task: 'e2e:ci', depends_on: 'test:ci' },
                        { task: 'version:prod', depends_on: 'e2e:ci' },
                        { task: 'terraform:prod', depends_on: 'version:prod' },
                        { task: 'helm:prod', depends_on: 'terraform:prod' },
                    ],
                },
            }),
        );
        updateJson(appTree, 'nx.json', nxJson => ({
            ...nxJson,
            stacks: {
                config: {
                    business: {
                        company: 'Amido',
                        domain: 'stacks',
                        component: 'nx',
                    },
                    domain: {
                        internal: 'test.com',
                        external: 'test.dev',
                    },
                    cloud: {
                        region: 'euw',
                        platform: 'azure',
                    },
                    pipeline: 'azdo',
                    terraform: {
                        group: 'terraform-group',
                        storage: 'terraform-storage',
                        container: 'terraform-container',
                    },
                    vcs: {
                        type: 'github',
                        url: 'remote.git',
                    },
                },
            },
        }));
        appTree.write('build/tasks.yaml', YAML.stringify({ tasks: {} }));
    });

    afterEach(() => {
        appTree.delete('taskctl.yaml');
        appTree.delete('build/tasks.yaml');
    });

    it('should run successfully with native regression', async () => {
        const options: VisualRegressionDeploymentGeneratorSchema = {
            type: 'native',
        };
        await generator(appTree, options);

        // Add infra tasks
        const taskctlYAML = YAML.parse(appTree.read('taskctl.yaml', 'utf8'));
        expect(taskctlYAML.pipelines.updatesnapshots).toBeTruthy();
    }, 100_000);

    it('should run successfully with native regeression and azure builds have been generated', async () => {
        appTree.write('build/azDevOps/azuredevops-stages.yaml', '');
        const options: VisualRegressionDeploymentGeneratorSchema = {
            type: 'native',
        };
        await generator(appTree, options);
        const azureUpdateSnapshots = YAML.parse(
            appTree.read(
                'build/azDevOps/azuredevops-updatesnapshots.yaml',
                'utf8',
            ),
        );
        expect(azureUpdateSnapshots.variables).toBeTruthy();
        expect(azureUpdateSnapshots.variables).toEqual([
            { template: 'azuredevops-vars.yaml' },
            { group: 'Amido-stacks-nx-common' },
            { name: 'DebugPreference', value: 'Continue' },
            { group: 'Amido-stacks-nx-nonprod' },
        ]);
    });
});
