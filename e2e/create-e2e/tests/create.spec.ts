import {
    tmpProjPath,
    checkFilesExist,
    readJson,
} from '@nrwl/nx-plugin/testing';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { cleanup } from '@ensono-stacks/e2e';

describe('create', () => {
    beforeAll(async () => {
        const temporaryDirectory = path.dirname(tmpProjPath());

        if (!fs.existsSync(temporaryDirectory)) {
            fs.mkdirSync(temporaryDirectory, { recursive: true });
        }

        execSync(
            'npx @ensono-stacks/create-stacks-workspace@latest proj --no-interactive',
            {
                cwd: temporaryDirectory,
                stdio: 'pipe',
                env: process.env,
            },
        );
    });

    afterAll(() => {
        // cleanup();
    });

    it('installs the workspace dependency', async () => {
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
