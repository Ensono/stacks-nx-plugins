import {
    checkFilesExist,
    readJson,
    runNxCommandAsync,
} from '@nrwl/nx-plugin/testing';
import { newProject, cleanup } from '@ensono-stacks/e2e';
describe('workspace', () => {
    beforeAll(async () => {
        await newProject(['@ensono-stacks/workspace']);
    });

    afterAll(() => {
        runNxCommandAsync('reset');
        cleanup();
    });

    it('runs the install generator', async () => {
        await runNxCommandAsync(
            `generate @ensono-stacks/workspace:install --no-interactive`,
            {
                env: {
                    // Nx create will not create a git context for e2e,
                    // so skip husky installation
                    // https://github.com/typicode/husky/blob/main/src/index.ts#L14
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
    }, 100000);
});
