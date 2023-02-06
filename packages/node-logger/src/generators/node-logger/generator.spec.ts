import { readJson, readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import generator from './generator';
import { NodeLoggerGeneratorSchema } from './schema';

describe('node-logger generator', () => {
    let tree: Tree;
    const options: NodeLoggerGeneratorSchema = {
        name: 'testClient',
        logLevelType: 'npm',
        consoleLogs: false,
        fileTransportPath: undefined,
        httpTransport: undefined,
        httpTransportPath: undefined,
        httpTransportHost: undefined,
        httpTransportPort: undefined,
        httpTransportSSL: undefined,
        streamPath: undefined,
    };

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should generate the node-logger', async () => {
        await generator(tree, {
            ...options,
            directory: 'custom',
            tags: 'test, client',
        });

        const config = readProjectConfiguration(tree, 'custom-test-client');

        expect(config).toBeDefined();
        expect(config.tags).toEqual(['test', 'client']);
        expect(tree.exists('test-client/src/index.ts'));
        expect(tree.exists('test-client/src/index.test.ts'));
    });

    it('should install winston as a dependency', async () => {
        await generator(tree, options);

        const packageJson = readJson(tree, 'package.json');
        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['winston']),
        );
    });

    it('should add console log transport', async () => {
        await generator(tree, { ...options, consoleLogs: true });
        const indexFile = tree.read('/test-client/src/index.ts', 'utf-8');
        expect(indexFile).toContain(
            'logger.add(new winston.transports.Console())',
        );
    });

    it('should add file transport', async () => {
        await generator(tree, {
            ...options,
            fileTransportPath: '/log-file.log',
        });
        const indexFile = tree.read('/test-client/src/index.ts', 'utf-8');
        expect(indexFile).toContain(
            'logger.add(new winston.transports.File({filename: "/log-file.log"}))',
        );
    });

    it('should add http transport', async () => {
        await generator(tree, {
            ...options,
            httpTransport: true,
            httpTransportPath: '/testPath',
            httpTransportPort: 300,
            httpTransportHost: 'www.testsite.co.uk',
        });
        const indexFile = tree.read('/test-client/src/index.ts', 'utf-8');
        expect(indexFile).toContain(
            'const httpTransportConfiguration: winston.transports.HttpTransportOptions = {};',
        );
        expect(indexFile).toContain(
            `httpTransportConfiguration.host = 'www.testsite.co.uk'`,
        );
        expect(indexFile).toContain('httpTransportConfiguration.port = 300');
        expect(indexFile).toContain(
            `httpTransportConfiguration.path = '/testPath'`,
        );
        expect(indexFile).toContain(
            'logger.add(new winston.transports.Http(httpTransportConfiguration));',
        );
    });
    it('should add stream transport', async () => {
        await generator(tree, {
            ...options,
            streamPath: 'www.testsite.co.uk',
        });
        const indexFile = tree.read('/test-client/src/index.ts', 'utf-8');
        expect(indexFile).toContain(
            'logger.add(new winston.transports.Stream(streamTransportConfiguration));',
        );
    });
});
