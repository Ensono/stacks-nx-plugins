/**
 * This script stops the local registry for e2e testing purposes.
 * It is meant to be called in jest's globalTeardown.
 */

/// <reference path="registry.d.ts" />

import { execSync } from 'child_process';

export default () => {
    if (global.stopLocalRegistry) {
        global.stopLocalRegistry();
    }

    execSync('pnpm cache delete @ensono-stacks/*');
};
