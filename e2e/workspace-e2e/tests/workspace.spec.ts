import {
    checkFilesExist,
    readJson,
    runNxCommandAsync,
} from '@nrwl/nx-plugin/testing';
import { newProject, cleanup } from '@ensono-stacks/e2e';
describe('workspace', () => {
    jest.setTimeout(300_000);

    beforeAll(async () => {
        await newProject([]);
    });

    afterAll(() => {
        runNxCommandAsync('reset');
        cleanup();
    });

    it('runs the install generator', async () => {
        expect(() =>
            checkFilesExist(
                'tsconfig.base.json',
                '.eslintrc.json',
                'lint-staged.config.js',
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
