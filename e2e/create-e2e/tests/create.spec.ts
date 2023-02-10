import {
    tmpProjPath,
    checkFilesExist,
    readJson,
} from '@nrwl/nx-plugin/testing';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('create', () => {
    const temporaryDirectory = path.dirname(tmpProjPath());
    const cacheDirectory = path.join(temporaryDirectory, '.cache');

    beforeAll(async () => {
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
                'npx --yes @ensono-stacks/create-stacks-workspace@latest proj --business.company=Ensono --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --preset=apps --no-nxCloud --skipGit --no-interactive --verbose',
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
                pipeline: 'azdo',
                terraform: {
                    container: 'tf-container',
                    group: 'tf-group',
                    storage: 'tf-storage',
                },
                vcs: {
                    type: 'github',
                    url: 'remote.git',
                },
            }),
        );
        // rerunning should throw because the workspace exists
        expect(() => run()).toThrow();
    });

    it('can install within a specific directory if it does not exist', async () => {
        execSync(
            'npx --yes @ensono-stacks/create-stacks-workspace@latest ProjectTest --dir=./proj/project-name --business.company=Ensono --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --preset=apps --no-nxCloud --skipGit --no-interactive --verbose',
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
                'project-name/.eslintrc.json',
                'project-name/.husky/commit-msg',
                'project-name/.husky/pre-commit',
                'project-name/.husky/prepare-commit-msg',
            ),
        ).not.toThrow();
    });

    it('throws when dir already exists without overwrite', async () => {
        fs.mkdirSync(path.join(temporaryDirectory, 'proj', 'project-name'), {
            recursive: true,
        });
        const run = () =>
            execSync(
                'npx --yes @ensono-stacks/create-stacks-workspace@latest ProjectTest --dir=./proj/project-name --business.company=Ensono --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --preset=apps --no-nxCloud --skipGit --no-interactive --verbose',
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
        fs.mkdirSync(path.join(temporaryDirectory, 'proj', 'ProjectName'), {
            recursive: true,
        });
        execSync(
            'npx --yes @ensono-stacks/create-stacks-workspace@latest ProjectTest --dir=./proj/ProjectName --overwrite --business.company=Ensono --business.domain=Stacks --business.component=Nx --cloud.platform=azure --cloud.region=euw --domain.internal=nonprod.amidostacks.com --domain.external=prod.amidostacks.com --terraform.group=tf-group --terraform.storage=tf-storage --terraform.container=tf-container --vcs.type=github --preset=apps --no-nxCloud --skipGit --no-interactive --verbose',
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
                'ProjectName/.eslintrc.json',
                'ProjectName/.husky/commit-msg',
                'ProjectName/.husky/pre-commit',
                'ProjectName/.husky/prepare-commit-msg',
            ),
        ).not.toThrow();

        const nxJson = readJson('ProjectName/nx.json');
        expect(nxJson).toMatchObject(
            expect.objectContaining({
                npmScope: 'project-test',
            }),
        );
    });
});
