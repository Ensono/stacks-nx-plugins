import { readJsonFile } from '@nrwl/devkit';

export function getNxVersion(): string {
    return (
        process.env['NX_VERSION'] ||
        readJsonFile(`${process.cwd()}/package.json`).devDependencies[
            '@nrwl/workspace'
        ] ||
        'latest'
    );
}
