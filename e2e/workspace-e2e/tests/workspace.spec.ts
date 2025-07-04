import { checkFilesExist, readJson, tmpProjPath } from '@nx/plugin/testing';
import { newProject, cleanup } from '@ensono-stacks/e2e';
import { execSync, spawn } from 'child_process';
import { getPackageManagerCommand } from '@nx/devkit';

describe('workspace', () => {
    jest.setTimeout(1_000_000);

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

    it('commits via commitizen', async () => {
        const pm = getPackageManagerCommand(undefined, tmpProjPath());

        execSync('git init', {
            cwd: tmpProjPath(),
            stdio: 'inherit',
        });

        execSync('git add .', {
            cwd: tmpProjPath(),
            stdio: 'inherit',
        });

        execSync(pm.run('prepare'), {
            cwd: tmpProjPath(),
            stdio: 'inherit',
        });

        const commit = new Promise<string>((resolve, reject) => {
            const commitizenProcess = spawn('git', ['commit'], {
                cwd: tmpProjPath(),
                stdio: 'pipe',
            });

            commitizenProcess.stdout.on('data', data => {
                const output = data.toString();
                if (
                    output.includes(
                        "Select the type of change that you're committing",
                    )
                ) {
                    commitizenProcess.kill();
                    resolve('passed');
                }
            });

            commitizenProcess.on('error', error => {
                reject(error);
            });

            setTimeout(() => {
                reject(new Error('Commitizen prompt not found within timeout'));
            }, 5000);
        });

        execSync('rm -rf .git', {
            cwd: tmpProjPath(),
            stdio: 'inherit',
        });

        expect(commit).resolves.toBe('passed');
    });
});
