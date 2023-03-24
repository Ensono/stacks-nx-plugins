import { Tree, updateJson } from '@nrwl/devkit';

export function testInitStacksConfig(tree: Tree, project: string) {
    updateJson(tree, 'nx.json', nxJson => ({
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
            executedGenerators: {
                project: {
                    [project]: [],
                },
                workspace: [],
            },
        },
    }));
}
