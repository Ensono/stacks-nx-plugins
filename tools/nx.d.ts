import { NxJsonConfiguration } from '@nx/devkit';

declare module '@nx/devkit' {
    export interface NxJsonStacksExecutedGenerators {
        executedGenerators: {
            project: {
                [key: string]: array;
            };
            workspace: array;
        };
    }

    export interface NxJsonStacksConfiguration {
        config: {
            business: {
                company: string;
                domain: string;
                component: string;
            };
            domain: {
                internal: string;
                external: string;
            };
            terraform: {
                group: string;
                container: string;
                storage: string;
            };
            cloud: {
                platform: 'azure';
                region: string;
                group: string;
            };
            pipeline: 'azdo';
            vcs: {
                type: 'github' | 'azdo';
                url: string;
            };
        };
    }

    export interface NxJsonStacks
        extends NxJsonStacksConfiguration,
            NxJsonStacksExecutedGenerators {}
}
