import {
    tmpProjPath,
    checkFilesExist,
    readJson,
    runNxCommandAsync,
} from '@nrwl/nx-plugin/testing';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { cleanup } from '@ensono-stacks/e2e';

describe('create', () => {
    const temporaryDirectory = path.dirname(tmpProjPath());
    const cacheDirectory = path.join(temporaryDirectory, '.cache');

    beforeAll(async () => {
        if (!fs.existsSync(cacheDirectory)) {
            fs.mkdirSync(cacheDirectory, {
                recursive: true,
            });
        }
    });

    afterAll(async () => {
        if (fs.existsSync(cacheDirectory)) {
            fs.rmSync(cacheDirectory, { recursive: true, force: true });
        }
        await runNxCommandAsync('reset');
        cleanup();
    });

    it('configures an npm package nx workspace', async () => {
        execSync(
            'npx --yes @ensono-stacks/create-stacks-workspace@latest proj --preset=npm --no-nxCloud --skipGit --no-interactive --verbose',
            {
                cwd: temporaryDirectory,
                stdio: 'inherit',
                env: {
                    ...process.env,
                    npm_config_cache: cacheDirectory,
                    HUSKY: '0',
                },
            },
        );
        expect(() =>
            checkFilesExist(
                '.eslintrc.json',
                '.husky/commit-msg',
                '.husky/pre-commit',
                '.husky/prepare-commit-msg',
            ),
        ).not.toThrow();

        const packageJson = readJson('package.json');

        expect(packageJson).toMatchObject(
            expect.objectContaining({
                config: {
                    commitizen: {
                        path: '@commitlint/cz-commitlint',
                    },
                },
            }),
        );
    });
});
