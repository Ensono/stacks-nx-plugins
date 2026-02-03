import { Tree, updateJson } from '@nx/devkit';

export function addStacksAttributes(tree: Tree, project: string) {
    const stacksConfig = {
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
        vcs: {
            type: 'github',
            url: 'remote.git',
        },
    };

    const stacksExecutedGenerators = {
        project: {
            [project]: [],
        },
        workspace: [],
    };

    updateJson(tree, 'nx.json', nxJson => ({
        ...nxJson,
        stacks: {
            config: stacksConfig,
            executedGenerators: stacksExecutedGenerators,
        },
    }));

    return { stacksConfig, stacksExecutedGenerators };
}
