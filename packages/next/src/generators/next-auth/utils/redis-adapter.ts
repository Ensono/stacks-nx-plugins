import {
    formatFiles,
    generateFiles,
    getWorkspaceLayout,
    joinPathFragments,
    names,
    ProjectConfiguration,
    readWorkspaceConfiguration,
    Tree,
} from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/js';
import path from 'path';
import { Project, SyntaxKind } from 'ts-morph';

export interface RedisAdapterOptions {
    envVar: string;
    name?: string;
}

function configureAdapter(
    project: ProjectConfiguration,
    morphTree: Project,
    {
        npmScope,
        libraryName,
        envVar,
    }: {
        npmScope: string;
        libraryName: string;
        envVar: string;
    },
) {
    const nextAuthNode = morphTree.addSourceFileAtPath(
        joinPathFragments(
            project.root,
            'pages',
            'api',
            'auth',
            '[...nextauth].ts',
        ),
    );

    nextAuthNode.addImportDeclaration({
        namedImports: ['IORedisAdapter'],
        moduleSpecifier: `${npmScope}/${libraryName}`,
    });
    nextAuthNode.addImportDeclaration({
        namedImports: ['Redis'],
        moduleSpecifier: 'ioredis',
    });

    const callExpression = nextAuthNode
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .find(
            d =>
                d.getFirstChildByKind(SyntaxKind.Identifier).getText() ===
                'NextAuth',
        );

    if (!callExpression) {
        throw new Error('Unable to find the NextAuth implementation function.');
    }

    const config = callExpression.getFirstChildByKind(
        SyntaxKind.ObjectLiteralExpression,
    );

    const adapterProperty = config
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .find(
            c =>
                c.getFirstDescendantByKind(SyntaxKind.Identifier)?.getText() ===
                'adapter',
        );

    if (adapterProperty) {
        adapterProperty.remove();
    }
    config.addPropertyAssignment({
        name: 'adapter',
        initializer: `IORedisAdapter(new Redis(process.env.${envVar}))`,
    });

    nextAuthNode.saveSync();
}

export async function addRedisAdapter(
    tree: Tree,
    project: ProjectConfiguration,
    morphTree: Project,
    { envVar, name: nameParameter }: RedisAdapterOptions,
) {
    const { npmScope } = readWorkspaceConfiguration(tree);
    const name = nameParameter || 'next-auth-redis';

    const libraryName = names(name).fileName;
    const projectDirectory = libraryName;
    const projectRoot = `${
        getWorkspaceLayout(tree).libsDir
    }/${projectDirectory}`;

    // generate the lib package
    await libraryGenerator(tree, {
        name: libraryName,
    });
    // delete the default generated lib folder
    const libraryDirectory = path.join(projectRoot, 'src');
    tree.delete(path.join(libraryDirectory, 'lib'));
    tree.delete(path.join(libraryDirectory, 'index.ts'));

    // add files
    generateFiles(
        tree,
        path.join(__dirname, '..', 'files-redis'),
        projectRoot,
        {
            envVar,
            template: '',
        },
    );

    configureAdapter(project, morphTree, {
        npmScope,
        libraryName,
        envVar,
    });

    await formatFiles(tree);
}
