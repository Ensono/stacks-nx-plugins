import { NxJsonConfiguration } from '@nrwl/devkit';

declare module '@nrwl/devkit' {
    export interface NxJsonConfiguration {
        stacks: {
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
            executedGenerators: {
                project: {
                    [key: string]: array;
                };
                workspace: array;
            };
        };
    }
}
