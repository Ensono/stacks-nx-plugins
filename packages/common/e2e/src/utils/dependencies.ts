import { existsSync } from 'fs';
import path from 'path';

import type { ProjectGraph } from 'nx/src/config/project-graph';
import { ParsedCommandLine } from 'typescript';

import type { WorkspaceLibrary } from './types';

const workspaceRoot = path.join(__dirname, '../../../../../');
let tsConfig: ParsedCommandLine;
let tsPathMappings: ParsedCommandLine['options']['paths'];

let tsModule: typeof import('typescript');
function readTsConfig(tsConfigPath: string): ParsedCommandLine {
    if (!tsModule) {
        tsModule = require('typescript');
    }
    const readResult = tsModule.readConfigFile(
        tsConfigPath,
        tsModule.sys.readFile,
    );
    return tsModule.parseJsonConfigFileContent(
        readResult.config,
        tsModule.sys,
        path.dirname(tsConfigPath),
    );
}

function readTsConfiguration(tsConfigPath: string): ParsedCommandLine {
    if (!existsSync(tsConfigPath)) {
        throw new Error(
            `NX MF: TsConfig Path for workspace libraries does not exist! (${tsConfigPath}).`,
        );
    }

    return readTsConfig(tsConfigPath);
}

function getRootTsConfigFileName(): string | null {
    for (const tsConfigName of ['tsconfig.base.json', 'tsconfig.json']) {
        const tsConfigPath = path.join(workspaceRoot, tsConfigName);
        if (existsSync(tsConfigPath)) {
            return tsConfigName;
        }
    }

    return null;
}

function getRootTsConfigPath(): string | null {
    const tsConfigFileName = getRootTsConfigFileName();

    return tsConfigFileName ? path.join(workspaceRoot, tsConfigFileName) : null;
}

function readTsPathMappings(
    tsConfigPath: string = process.env.NX_TSCONFIG_PATH ??
        getRootTsConfigPath(),
): ParsedCommandLine['options']['paths'] {
    if (tsPathMappings) {
        return tsPathMappings;
    }

    tsConfig ??= readTsConfiguration(tsConfigPath);
    tsPathMappings = {};
    Object.entries(tsConfig.options?.paths ?? {}).forEach(([alias, paths]) => {
        tsPathMappings[alias] = paths.map(p => p.replace(/^\.\//, ''));
    });

    return tsPathMappings;
}

function getLibraryImportPath(
    library: string,
    projectGraph: ProjectGraph,
): string | undefined {
    const tsConfigPathMappings = readTsPathMappings();

    const { sourceRoot } = projectGraph.nodes[library].data;

    for (const [key, value] of Object.entries(tsConfigPathMappings)) {
        if (value.some(p => p.startsWith(sourceRoot))) {
            return key;
        }
    }

    return undefined;
}
function collectDependencies(
    projectGraph: ProjectGraph,
    name: string,
    // eslint-disable-next-line unicorn/no-object-as-default-parameter
    dependencies = {
        workspaceLibraries: new Map<string, WorkspaceLibrary>(),
        npmPackages: new Set<string>(),
    },
    seen: Set<string> = new Set(),
): {
    workspaceLibraries: Map<string, WorkspaceLibrary>;
    npmPackages: Set<string>;
} {
    if (seen.has(name)) {
        return dependencies;
    }
    seen.add(name);

    (projectGraph.dependencies[name] ?? []).forEach(dependency => {
        if (dependency.target.startsWith('npm:')) {
            dependencies.npmPackages.add(dependency.target.replace('npm:', ''));
        } else {
            dependencies.workspaceLibraries.set(dependency.target, {
                name: dependency.target,
                root: projectGraph.nodes[dependency.target].data.root,
                importKey: getLibraryImportPath(
                    dependency.target,
                    projectGraph,
                ),
            });
            collectDependencies(
                projectGraph,
                dependency.target,
                dependencies,
                seen,
            );
        }
    });

    return dependencies;
}

export function getDependentPackagesForProject(
    projectGraph: ProjectGraph,
    name: string,
): {
    workspaceLibraries: WorkspaceLibrary[];
    npmPackages: string[];
} {
    const { npmPackages, workspaceLibraries } = collectDependencies(
        projectGraph,
        name,
    );

    return {
        workspaceLibraries: [...workspaceLibraries.values()],
        npmPackages: [...npmPackages],
    };
}
