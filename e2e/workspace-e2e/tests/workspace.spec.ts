import {
    checkFilesExist,
    readJson,
    runNxCommandAsync,
} from '@nx/plugin/testing';
import { newProject } from '@ensono-stacks/e2e';
describe('workspace', () => {
    jest.setTimeout(1_000_000);

    beforeAll(async () => {
        await newProject();
    });

    afterAll(async () => {
        await runNxCommandAsync('reset');
    });
    r;

    it('adds and updates the relevant files', async () => {
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
    });

    it('updates the packages.json', () => {
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

    it('updates the eslintrc.json', () => {
        const eslintRc = readJson('.eslintrc.json');
        expect(eslintRc).toMatchSnapshot();
    });
});
