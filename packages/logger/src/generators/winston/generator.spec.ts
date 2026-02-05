import { tsMorphTree } from '@ensono-stacks/core';
import { checkFilesExistInTree } from '@ensono-stacks/test';
import {
    readProjectConfiguration,
    Tree,
    readJson,
    joinPathFragments,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import generator from './generator';
import { WinstonLoggerGeneratorSchema } from './schema';

const appName = 'test-logger';

function snapshotFiles(tree: Tree, files: string[]) {
    expect(() => checkFilesExistInTree(tree, ...files)).not.toThrow();
    const project = tsMorphTree(tree);

    files.forEach(file => {
        expect(project.addSourceFileAtPath(file).getText()).toMatchSnapshot(
            file,
        );
    });
}

describe('logger generator', () => {
    let tree: Tree;

    const options: WinstonLoggerGeneratorSchema = {
        name: appName,
        directory: appName,
        logLevelType: 'npm',
        consoleLogs: false,
        fileTransportPath: undefined,
        httpTransportPath: undefined,
        httpTransportHost: undefined,
        httpTransportPort: undefined,
        httpTransportSSL: undefined,
        streamPath: undefined,
    };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should generate the logger', async () => {
        await generator(tree, {
            ...options,
            directory: `custom/${appName}`,
            tags: 'test, logger',
        });

        const config = readProjectConfiguration(tree, 'test-logger');

        expect(config).toBeDefined();
        expect(config.tags).toEqual(['test', 'logger']);

        snapshotFiles(tree, [
            joinPathFragments(`custom/${appName}`, 'project.json'),
            joinPathFragments(`custom/${appName}`, 'tsconfig.json'),
            joinPathFragments(`custom/${appName}`, 'tsconfig.lib.json'),
            joinPathFragments(`custom/${appName}`, 'tsconfig.spec.json'),
            joinPathFragments(`custom/${appName}`, 'eslint.config.mjs'),
            joinPathFragments(`custom/${appName}`, 'package.json'),
            joinPathFragments(`custom/${appName}`, 'jest.config.cts'),
            joinPathFragments(`custom/${appName}/src`, 'index.ts'),
            joinPathFragments(`custom/${appName}/src`, 'index.test.ts'),
            'jest.config.ts',
            'jest.preset.js',
            '.prettierignore',
            '.prettierrc',
        ]);
    });

    it('should install winston as a dependency npm,', async () => {
        await generator(tree, options);

        const packageJson = readJson(tree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['winston']),
        );

        const indexFile = tree.read(`/${appName}/src/index.ts`, 'utf8');

        expect(indexFile).toContain('winston.config.npm.levels');
    });

    it('should install winston as a dependency cli', async () => {
        await generator(tree, {
            ...options,
            logLevelType: 'cli',
        });

        const packageJson = readJson(tree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['winston']),
        );

        const indexFile = tree.read(`/${appName}/src/index.ts`, 'utf8');

        expect(indexFile).toContain('winston.config.cli.levels');
    });

    it('should install winston as a dependency syslog', async () => {
        await generator(tree, {
            ...options,
            logLevelType: 'syslog',
        });

        const packageJson = readJson(tree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['winston']),
        );

        const indexFile = tree.read(`/${appName}/src/index.ts`, 'utf8');

        expect(indexFile).toContain('winston.config.syslog.levels');
    });

    it('should add console log transport', async () => {
        await generator(tree, { ...options, consoleLogs: true });
        const indexFile = tree.read(`/${appName}/src/index.ts`, 'utf8');

        expect(indexFile).toContain(
            'logger.add(new winston.transports.Console())',
        );
    });

    it('should add file transport', async () => {
        await generator(tree, {
            ...options,
            fileTransportPath: '/log-file.log',
        });
        const indexFile = tree.read(`/${appName}/src/index.ts`, 'utf8');

        expect(indexFile).toContain(
            "logger.add(new winston.transports.File({ filename: '/log-file.log' }))",
        );
    });

    it('should add http transport', async () => {
        await generator(tree, {
            ...options,
            httpTransportPath: '/testPath',
            httpTransportPort: 300,
            httpTransportHost: 'www.testsite.co.uk',
        });
        const indexFile = tree.read(`/${appName}/src/index.ts`, 'utf8');

        expect(indexFile).toContain(
            'const httpTransportConfiguration: winston.transports.HttpTransportOptions = {',
        );
        expect(indexFile).toContain(`host: 'www.testsite.co.uk'`);
        expect(indexFile).toContain('port: 300');
        expect(indexFile).toContain(`path: '/testPath'`);
        expect(indexFile).toContain(
            'logger.add(new winston.transports.Http(httpTransportConfiguration));',
        );
    });
    it('should add stream transport', async () => {
        await generator(tree, {
            ...options,
            streamPath: 'www.testsite.co.uk',
        });
        const indexFile = tree.read(`/${appName}/src/index.ts`, 'utf8');

        expect(indexFile).toContain(
            'logger.add(new winston.transports.Stream(streamTransportConfiguration));',
        );
    });

    it('should add the ci config in the test command in the project.json', async () => {
        await generator(tree, options);

        const projectConfig = readJson(tree, `${appName}/project.json`);

        expect(projectConfig.targets.test).toMatchObject(
            expect.objectContaining({
                configurations: {
                    ci: {
                        ci: true,
                        collectCoverage: true,
                        coverageReporters: ['text', 'html'],
                        collectCoverageFrom: [
                            './**/*.{js,jsx,ts,tsx}',
                            './!**/*.config.*',
                        ],
                        codeCoverage: true,
                    },
                },
            }),
        );
    });

    it('should add the ci config in the test command in the project.json with a custom directory', async () => {
        await generator(tree, { ...options, directory: 'custom' });

        const projectConfig = readJson(tree, `custom/project.json`);

        expect(projectConfig.targets.test).toMatchObject(
            expect.objectContaining({
                configurations: {
                    ci: {
                        ci: true,
                        collectCoverage: true,
                        coverageReporters: ['text', 'html'],
                        collectCoverageFrom: [
                            './**/*.{js,jsx,ts,tsx}',
                            './!**/*.config.*',
                        ],
                        codeCoverage: true,
                    },
                },
            }),
        );
    });
});
