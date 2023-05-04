import { readJsonFile } from '@nx/devkit';

export function getNxVersion(): string {
    return (
        process.env['NX_VERSION'] ||
        readJsonFile(`${process.cwd()}/package.json`).devDependencies[
            '@nx/workspace'
        ] ||
        'latest'
    );
}
