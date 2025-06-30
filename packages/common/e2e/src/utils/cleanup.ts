import { tmpProjPath } from '@nx/plugin/testing';
import { existsSync, rmSync } from 'fs';

export function cleanup(projectDirectory = tmpProjPath()) {
    if (existsSync(projectDirectory)) {
        rmSync(projectDirectory, { force: true, recursive: true });
    }
}
