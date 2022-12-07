import { tmpProjPath } from '@nrwl/nx-plugin/testing';
import { existsSync, rmSync } from 'fs';
import path from 'path';

export function cleanup(registry = false) {
    const temporaryProject = tmpProjPath();
    if (existsSync(temporaryProject)) {
        rmSync(temporaryProject, { force: true, recursive: true });
    }

    const localRegistryStorage = path.join(
        temporaryProject,
        '..',
        '..',
        'local-registry',
    );

    if (registry && existsSync(localRegistryStorage)) {
        rmSync(localRegistryStorage, { force: true, recursive: true });
    }
}
