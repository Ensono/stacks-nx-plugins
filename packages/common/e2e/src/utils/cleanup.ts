import { existsSync, rmSync } from 'fs';

import { tmpProjPath } from '@nx/plugin/testing';

export function cleanup(projectDirectory = tmpProjPath()) {
    if (existsSync(projectDirectory)) {
        rmSync(projectDirectory, { force: true, recursive: true });
    }
}
