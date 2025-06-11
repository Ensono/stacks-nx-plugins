/**
 * This script stops the local registry for e2e testing purposes.
 * It is meant to be called in jest's globalTeardown.
 */

/// <reference path="registry.d.ts" />

import { execSync } from 'child_process';
import { rmSync } from 'fs';
import path from 'path';

export default () => {
    if (global.stopLocalRegistry) {
        global.stopLocalRegistry();
    }

    // rmSync(path.join(process.cwd(), 'tmp', 'local-registry', '.npm'), {
    //     recursive: true,
    //     force: true,
    // });
    execSync('pnpm cache delete @ensono-stacks/*');
};
