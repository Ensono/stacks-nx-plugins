import { existsSync, rmSync } from 'fs';

export function cleanup(projectDirectory: string) {
    if (existsSync(projectDirectory)) {
        rmSync(projectDirectory, { force: true, recursive: true });
    }
}
