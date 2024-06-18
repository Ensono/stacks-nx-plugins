import {
    formatFilesWithEslint,
    verifyPluginCanBeInstalled,
} from '@ensono-stacks/core';
import {
    generateFiles,
    joinPathFragments,
    readProjectConfiguration,
    Tree,
    runTasksInSerial,
    GeneratorCallback,
    updateJson,
    offsetFromRoot,
    workspaceRoot,
} from '@nx/devkit';
import {
    determineProjectNameAndRootOptions,
    type ProjectNameAndRootOptions,
} from '@nx/devkit/src/generators/project-name-and-root-utils';
import { libraryGenerator } from '@nx/js';
import path from 'path';

import { NextAuthGeneratorSchema } from './schema';
import { installDependencies } from './utils/dependencies';
import { addToLocalEnv } from './utils/local-env';
import { addProvider } from './utils/provider';

export interface NormalizedSchema extends NextAuthGeneratorSchema {
    name: string;
    projectNames: ProjectNameAndRootOptions['names'];
    fileName: string;
    projectRoot: string;
    parsedTags: string[];
    importPath?: string;
}

async function normalizeOptions(tree: Tree, options: NextAuthGeneratorSchema) {
    const {
        projectName,
        names: projectNames,
        projectRoot,
        importPath,
    } = await determineProjectNameAndRootOptions(tree, {
        name: options.name,
        projectType: 'library',
        directory: options.directory,
        importPath: options.importPath,
        callingGenerator: '@ensono-stacks/next:next-auth',
    });

    return {
        ...options,
        name: projectName,
        projectNames,
        projectRoot,
        importPath,
    };
}

export default async function nextAuthGenerator(
    tree: Tree,
    options: NextAuthGeneratorSchema,
) {
    const tasks: GeneratorCallback[] = [];
    verifyPluginCanBeInstalled(tree, options.project);

    const normalizedOptions = await normalizeOptions(tree, options);

    const project = readProjectConfiguration(tree, options.project);

    tasks.push(
        await libraryGenerator(tree, {
            ...options,
            // projectNameAndRootFormat: 'derived',
            unitTestRunner: 'jest',
        }),
    );

    const libraryDirectory = path.join(normalizedOptions.projectRoot, 'src');
    tree.delete(path.join(libraryDirectory, 'lib'));

    // Add base auth library
    generateFiles(
        tree,
        path.join(__dirname, 'files', 'library'),
        normalizedOptions.projectRoot,
        {
            template: '',
            ...normalizedOptions,
        },
    );

    // Add Provider
    if (normalizedOptions.provider !== 'none') {
        addProvider(
            normalizedOptions.provider,
            normalizedOptions.projectRoot,
            tree,
        );

        // Add Oauth actions and Utils
        generateFiles(
            tree,
            path.join(__dirname, 'files', 'oauth'),
            normalizedOptions.projectRoot,
            {
                template: '',
                ...normalizedOptions,
            },
        );
    }

    // Add Config/Adapter for Session Storage
    generateFiles(
        tree,
        path.join(__dirname, 'files', normalizedOptions.sessionStorage),
        normalizedOptions.projectRoot,
        {
            template: '',
            ...normalizedOptions,
        },
    );

    // Add Guest Session Provider
    if (normalizedOptions.guestSession) {
        addProvider('guest', normalizedOptions.projectRoot, tree);
        const configPath = path.join(
            normalizedOptions.projectRoot,
            'src',
            'config.ts',
        );
        const config = tree
            .read(configPath)
            .toString('utf8')
            .replace(/\n+$/, '');
        tree.write(
            configPath,
            `${config}\nexport const GUEST_SESSION_COOKIE_NAME = 'auth.js.guest';\n`,
        );

        if (
            !tree.exists(
                joinPathFragments(
                    project.root,
                    'src',
                    'components',
                    'guest-session.tsx',
                ),
            )
        ) {
            generateFiles(
                tree,
                path.join(__dirname, 'files', 'components'),
                project.root,
                {
                    template: '',
                    ...normalizedOptions,
                },
            );
        }
    }

    // if not generated - create route.ts in pages/api/auth/[...nextauth] and auth.ts in root directory
    if (
        !tree.exists(
            joinPathFragments(
                project.root,
                'src',
                'app',
                'auth',
                '[...nextauth]',
                'route.ts',
            ),
        )
    ) {
        generateFiles(
            tree,
            path.join(__dirname, 'files', 'next'),
            project.root,
            {
                template: '',
                ...normalizedOptions,
            },
        );
    }

    // update app tsconfig
    updateJson(tree, joinPathFragments(project.root, 'tsconfig.json'), data => {
        const rootToLibraryPath = normalizedOptions.projectRoot.replace(
            workspaceRoot,
            '',
        );
        const pathToType = `${offsetFromRoot(
            project.root,
        )}${rootToLibraryPath}/src/types/index.d.ts`;

        if (!data.include.includes(pathToType)) {
            data.include.push(pathToType);
        }

        return data;
    });

    if (!normalizedOptions.skipPackageJson) {
        tasks.push(installDependencies(tree, options));
    }

    tasks.push(
        formatFilesWithEslint(normalizedOptions.projectNames.projectFileName),
        addToLocalEnv(project, tree, options),
    );

    return runTasksInSerial(...tasks);
}
