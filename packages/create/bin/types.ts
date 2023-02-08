import { PackageManager } from './package-manager';

export type CreateStacksArguments = {
    name: string;
    dir: string;
    preset: string;
    appName: string;
    nxVersion: string;
    packageManager: PackageManager;
    interactive: boolean;
    overwrite: boolean;
    terraform: {
        group: string;
        container: string;
        storage: string;
    };
    business: {
        company: string;
        domain: string;
        component: string;
    };
    domain: {
        internal: string;
        external: string;
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

export enum Preset {
    Apps = 'apps',
    TS = 'ts',
    NextJs = 'next',
    ReactMonorepo = 'react-monorepo',
}
