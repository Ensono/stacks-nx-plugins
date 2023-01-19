import { PackageManager } from './package-manager';

export type CreateStacksArguments = {
    name: string;
    preset: string;
    appName: string;
    nxVersion: string;
    packageManager: PackageManager;
};

export enum Preset {
    Apps = 'apps',
    TS = 'ts',
    NextJs = 'next',
    ReactMonorepo = 'react-monorepo',
}
