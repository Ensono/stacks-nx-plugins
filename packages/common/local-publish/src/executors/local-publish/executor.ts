import axios from 'axios';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { LocalPublishExecutorSchema } from './schema';

const packageDirectories = {
    'azure-node': 'packages/azure-node',
    'azure-react': 'packages/azure-react',
    'common-core': 'packages/common/core',
    create: 'packages/create',
    cypress: 'packages/cypress',
    logger: 'packages/logger',
    next: 'packages/next',
    playwright: 'packages/playwright',
    'rest-client': 'packages/rest-client',
    workspace: 'packages/workspace',
};

function bumpVersion(version: string): string {
    const [major, minor, patch] = version
        .split('.')
        .map(number => Number.parseInt(number, 10));

    return `${major}.${minor}.${patch + 1}`;
}

async function isVerdaccioRunning() {
    try {
        return await axios.get('http://localhost:4873');
    } catch {
        return false;
    }
}

export default async function runExecutor(options: LocalPublishExecutorSchema) {
    const verdaccioRunning = await isVerdaccioRunning();
    if (!verdaccioRunning) {
        console.error(
            'Verdaccio is not running, please run `nx local-registry in a separate terminal first`',
        );
        return { success: false };
    }

    execSync(options.buildCommand, { stdio: 'inherit' });

    const buildDirectoryPath = path.resolve('./dist');
    const versionCacheFilePath = path.join(
        buildDirectoryPath,
        '.local-publish-cache.json',
    );
    const versionCacheFile = fs.existsSync(versionCacheFilePath)
        ? JSON.parse(fs.readFileSync(versionCacheFilePath, 'utf8'))
        : {};

    Object.keys(packageDirectories).forEach(packageName => {
        const packagePath = path.join(
            buildDirectoryPath,
            packageDirectories[packageName],
        );

        try {
            process.chdir(packagePath);
            const currentVersion = versionCacheFile[packageName];
            const packageJsonPath = path.join(packagePath, 'package.json');
            const packageJson = JSON.parse(
                fs.readFileSync(packageJsonPath, 'utf8'),
            );

            const newVersion = bumpVersion(
                currentVersion || packageJson.version,
            );
            packageJson.version = newVersion;

            fs.writeFileSync(
                packageJsonPath,
                JSON.stringify(packageJson, null, 2),
            );

            versionCacheFile[packageName] = newVersion;

            execSync('npm publish', { stdio: 'inherit' });
        } catch {
            throw new Error(
                `Error bumping version for ${packageName}, Please restart the local registry and try again.`,
            );
        }
    });

    fs.writeFileSync(
        versionCacheFilePath,
        JSON.stringify(versionCacheFile, null, 2),
    );

    return { success: true };
}
