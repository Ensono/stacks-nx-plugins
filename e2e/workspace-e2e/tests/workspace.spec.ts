import { newProject, cleanup } from '@ensono-stacks/e2e';
import { checkFilesExist, readJson, readFile } from '@nx/plugin/testing';

describe('workspace', () => {
    beforeAll(async () => {
        await newProject();
    });

    afterAll(async () => {
        cleanup();
    });

    it('adds and updates the relevant files', async () => {
        expect(() =>
            checkFilesExist(
                'tsconfig.base.json',
                'eslint.config.mjs',
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

    it('generates flat eslint config', () => {
        const eslintConfig = readFile('eslint.config.mjs');

        expect(eslintConfig).toMatchSnapshot();
        expect(eslintConfig).toContain('typescript-eslint');
        expect(eslintConfig).toContain('eslint-plugin-security');
        expect(eslintConfig).toContain('eslint-plugin-unicorn');
        expect(eslintConfig).toContain('eslint-plugin-import');
        expect(eslintConfig).toContain('eslint-plugin-prettier');
    });
});
