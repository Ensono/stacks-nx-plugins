import packageJson from '../package.json';

export const generatorDependencyVersions = {
    'stacks-nx-plugins': packageJson.version,
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
};

/**
 * Transform an npm package name into a valid __versions__ property key.
 *
 * Rules:
 * 1. Strip leading @
 * 2. Replace / with ___ (triple underscore — scope separator)
 * 3. Replace - and . with _
 *
 * @example toVersionKey('@tanstack/react-query') => '__versions__.tanstack___react_query'
 * @example toVersionKey('axios') => '__versions__.axios'
 */
export function toVersionKey(packageName) {
    return (
        '__versions__.' +
        packageName
            .replace(/^@/, '')
            .replace(/\//g, '___')
            .replace(/[-\.]/g, '_')
    );
}

/**
 * Build the Vite `define` map for version replacement.
 *
 * Returns a Record where keys are __versions__.* expressions
 * and values are JSON.stringify'd version strings.
 */
export function buildVersionDefineMap() {
    const defineMap = {};
    for (const [pkg, version] of Object.entries(generatorDependencyVersions)) {
        defineMap[toVersionKey(pkg)] = JSON.stringify(version);
    }

    defineMap['__system__.node'] = JSON.stringify(
        packageJson.engines.node.replace('^', ''),
    );

    return defineMap;
}
