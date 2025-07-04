import { PackageManager } from './package-manager';

export type CreateStacksArguments = {
    name: string;
    dir: string;
    preset: string;
    appName: string;
    e2eTestRunner: string;
    nxVersion: string;
    stacksVersion: string;
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
    TS = 'ts',
    NextJs = 'next',
}

// eslint-disable-next-line unicorn/prevent-abbreviations
export enum E2eTestRunner {
    None = 'none',
    Playwright = 'playwright',
}
