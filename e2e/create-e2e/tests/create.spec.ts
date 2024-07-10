import { getNxVersion } from '@ensono-stacks/e2e';
import { tmpProjPath, checkFilesExist, readJson } from '@nx/plugin/testing';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('create', () => {
    const temporaryDirectory = path.dirname(tmpProjPath());
    const cacheDirectory = path.join(temporaryDirectory, '.cache');
    let nxVersion;

    beforeAll(async () => {
        nxVersion = await getNxVersion();
        if (!fs.existsSync(cacheDirectory)) {
            fs.mkdirSync(cacheDirectory, {
                recursive: true,
            });
        }

        if (fs.existsSync(path.join(temporaryDirectory))) {
            fs.rmSync(path.join(temporaryDirectory), {
                recursive: true,
                force: true,
            });
        }
    });

    beforeEach(() => {
        if (!fs.existsSync(temporaryDirectory)) {
            fs.mkdirSync(temporaryDirectory, {
                recursive: true,
            });
        }
    });

    afterAll(async () => {
        if (fs.existsSync(cacheDirectory)) {
            fs.rmSync(cacheDirectory, { recursive: true, force: true });
        }
    });

    afterEach(() => {
        if (fs.existsSync(temporaryDirectory)) {
            fs.rmSync(temporaryDirectory, {
                recursive: true,
                force: true,
            });
        }
    });

    it('configures an empty apps stacks workspace', async () => {
        const run = () =>
            execSync(
                `npx --yes @ensono-stacks/create-stacks-workspace@latest proj --nxVersion=${nxVersion} --business.company=Ensono --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --preset=apps --nxCloud=skip --skipGit --no-interactive --verbose`,
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

        expect(() => run()).not.toThrow();

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

        const nxJson = readJson('nx.json');

        expect(nxJson.stacks).toMatchObject(
            expect.objectContaining({
                config: {
                    business: {
                        company: 'Ensono',
                        component: 'Nx',
                        domain: 'Stacks',
                    },
                    cloud: {
                        platform: 'azure',
                        region: 'euw',
                    },
                    domain: {
                        external: 'prod.amidostacks.com',
                        internal: 'nonprod.amidostacks.com',
                    },
                    terraform: {
                        container: 'tf-container',
                        group: 'tf-group',
                        storage: 'tf-storage',
                    },
                    vcs: {
                        type: 'github',
                    },
                },
            }),
        );
        // rerunning should throw because the workspace exists
        expect(() => run()).toThrow();
    });

    it('can install within a specific directory if it exists', async () => {
        fs.mkdirSync(path.join(temporaryDirectory, 'proj', 'test'), {
            recursive: true,
        });
        execSync(
            `npx --yes @ensono-stacks/create-stacks-workspace@latest ProjectTest --dir=./proj/test --nxVersion=${nxVersion} --business.company=Ensono --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --preset=apps --nxCloud=skip --skipGit --no-interactive --verbose`,
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
                'test/project-test/.eslintrc.json',
                'test/project-test/.husky/commit-msg',
                'test/project-test/.husky/pre-commit',
                'test/project-test/.husky/prepare-commit-msg',
            ),
        ).not.toThrow();
    });

    it('throws when dir already exists without overwrite', async () => {
        fs.mkdirSync(path.join(temporaryDirectory, 'proj', 'test', 'name'), {
            recursive: true,
        });
        const run = () =>
            execSync(
                `npx --yes @ensono-stacks/create-stacks-workspace@latest name --dir=./proj/test --nxVersion=${nxVersion} --business.company=Ensono --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --preset=apps --nxCloud=skip  --skipGit --no-interactive --verbose`,
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

        expect(() => run()).toThrow();
    });

    it('can install to a specific directory with overwrite (stacks-cli)', async () => {
        fs.mkdirSync(
            path.join(temporaryDirectory, 'proj', 'test', 'project-test'),
            {
                recursive: true,
            },
        );
        execSync(
            `npx --yes @ensono-stacks/create-stacks-workspace@latest projectTest --dir=./proj/test --nxVersion=${nxVersion} --overwrite --business.company=Ensono --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --preset=apps --nxCloud=skip --skipGit --no-interactive --verbose`,
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
                'test/project-test/.eslintrc.json',
                'test/project-test/.husky/commit-msg',
                'test/project-test/.husky/pre-commit',
                'test/project-test/.husky/prepare-commit-msg',
            ),
        ).not.toThrow();
    });

    it('can install with playwright set as e2eTestRunner', async () => {
        const run = () =>
            execSync(
                `npx --yes @ensono-stacks/create-stacks-workspace@latest proj --nxVersion=${nxVersion} --business.company=Ensono --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --preset=next --appName=test-app --e2eTestRunner=playwright --nxCloud=skip --skipGit --no-interactive --verbose`,
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

        expect(() => run()).not.toThrow();
    });

    it('can install with cypress set as e2eTestRunner', async () => {
        const run = () =>
            execSync(
                `npx --yes @ensono-stacks/create-stacks-workspace@latest proj --nxVersion=${nxVersion} --business.company=Ensono --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --preset=next --appName=test-app --e2eTestRunner=cypress --nxCloud=skip --skipGit --no-interactive --verbose`,
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

        expect(() => run()).not.toThrow();
    });

    it('can install different nx version', async () => {
        const run = () =>
            execSync(
                `npx --yes @ensono-stacks/create-stacks-workspace@latest proj --preset=next --appName=test-app --nxVersion 18.3.0 --nxCloud=skip  --skipGit --no-interactive --verbose`,
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

        expect(() => run()).not.toThrow();

        const packageJson = readJson('package.json');

        expect(packageJson.devDependencies).toMatchObject(
            expect.objectContaining({
                '@nx/workspace': '18.3.0',
            }),
        );
    });
});
