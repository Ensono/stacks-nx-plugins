import path from 'path';
import { Project, SyntaxKind } from 'ts-morph';

/**
 * Adds module aliases to Turbopack configuration in next.config.js
 *
 * Example next.config.js structure from Nx:
 * const nextConfig = { nx: {} };
 * const plugins = [withNx];
 * module.exports = composePlugins(...plugins)(nextConfig);
 *
 * This adds:
 * module.exports = composePlugins(...plugins)({
 *   ...nextConfig,
 *   turbopack: {
 *     resolveAlias: { 'ioredis': 'ioredis-mock' }
 *   }
 * });
 */
export function addTurbopackAlias(
    projectRoot: string,
    alias: Record<string, string>,
) {
    const project = new Project({
        tsConfigFilePath: path.join(projectRoot, 'tsconfig.json'),
    });

    const config = project.addSourceFileAtPath(
        path.join(projectRoot, 'next.config.js'),
    );

    // Find the nextConfig variable declaration
    const variableDeclaration = config
        .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
        .find(
            d =>
                d.getFirstDescendantByKind(SyntaxKind.Identifier)?.getText() ===
                'nextConfig',
        );

    const nextConfigExpression = variableDeclaration?.getFirstDescendantByKind(
        SyntaxKind.ObjectLiteralExpression,
    );

    if (!variableDeclaration || !nextConfigExpression) {
        throw new Error('Missing `const nextConfig = {}` in next.config.js');
    }

    // Check if turbopack property already exists
    let turbopackProperty = nextConfigExpression
        .getProperties()
        .find(
            p =>
                p.getKind() === SyntaxKind.PropertyAssignment &&
                (p as any).getName() === 'turbopack',
        );

    if (!turbopackProperty) {
        // Add turbopack property with resolveAlias
        nextConfigExpression.addPropertyAssignment({
            name: 'turbopack',
            initializer: `{\n    resolveAlias: {}\n  }`,
        });

        turbopackProperty = nextConfigExpression
            .getProperties()
            .find(
                p =>
                    p.getKind() === SyntaxKind.PropertyAssignment &&
                    (p as any).getName() === 'turbopack',
            );
    }

    if (
        !turbopackProperty ||
        turbopackProperty.getKind() !== SyntaxKind.PropertyAssignment
    ) {
        throw new Error('Failed to find or create turbopack property');
    }

    // Find the turbopack object literal
    const turbopackObject = (turbopackProperty as any)
        .getInitializer()
        ?.asKind(SyntaxKind.ObjectLiteralExpression);

    if (!turbopackObject) {
        throw new Error('turbopack property is not an object');
    }

    // Check if resolveAlias exists
    let resolveAliasProperty = turbopackObject
        .getProperties()
        .find(
            p =>
                p.getKind() === SyntaxKind.PropertyAssignment &&
                (p as any).getName() === 'resolveAlias',
        );

    if (!resolveAliasProperty) {
        turbopackObject.addPropertyAssignment({
            name: 'resolveAlias',
            initializer: '{}',
        });

        resolveAliasProperty = turbopackObject
            .getProperties()
            .find(
                p =>
                    p.getKind() === SyntaxKind.PropertyAssignment &&
                    (p as any).getName() === 'resolveAlias',
            );
    }

    if (
        !resolveAliasProperty ||
        resolveAliasProperty.getKind() !== SyntaxKind.PropertyAssignment
    ) {
        throw new Error('Failed to find or create resolveAlias property');
    }

    const aliasExpression = (resolveAliasProperty as any)
        .getInitializer()
        ?.asKind(SyntaxKind.ObjectLiteralExpression);

    if (!aliasExpression) {
        throw new Error('resolveAlias is not an object');
    }

    // Add aliases
    Object.entries(alias).forEach(([key, value]) => {
        aliasExpression.addPropertyAssignment({
            name: `'${key}'`,
            initializer: `'${value}'`,
        });
    });

    config.saveSync();
}

export function addWebpackAlias(
    projectRoot: string,
    alias: Record<string, string>,
) {
    const project = new Project({
        tsConfigFilePath: path.join(projectRoot, 'tsconfig.json'),
    });

    const config = project.addSourceFileAtPath(
        path.join(projectRoot, 'next.config.js'),
    );

    let webpackAssignment = config
        .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .find(
            d =>
                d.getFirstDescendantByKind(SyntaxKind.Identifier)?.getText() ===
                'webpack',
        );

    if (!webpackAssignment) {
        const variableDecleration = config
            .getDescendantsOfKind(SyntaxKind.VariableDeclaration)
            .find(
                d =>
                    d
                        .getFirstDescendantByKind(SyntaxKind.Identifier)
                        ?.getText() === 'nextConfig',
            );

        const expression = variableDecleration?.getFirstDescendantByKind(
            SyntaxKind.ObjectLiteralExpression,
        );
        if (!variableDecleration || !expression) {
            throw new Error(
                'Missing `const nextConfig = {}` in next.config.js',
            );
        }

        expression.addProperty(`webpack: (init) => {
    const config = {...init};
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
      },
    };
    return config;
}`);

        webpackAssignment = config
            .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
            .find(
                d =>
                    d
                        .getFirstDescendantByKind(SyntaxKind.Identifier)
                        ?.getText() === 'webpack',
            );
    }

    const aliasAssignment = webpackAssignment
        ?.getDescendantsOfKind(SyntaxKind.PropertyAssignment)
        .find(
            d =>
                d.getFirstDescendantByKind(SyntaxKind.Identifier)?.getText() ===
                'alias',
        );

    const aliasExpression = aliasAssignment?.getFirstDescendantByKind(
        SyntaxKind.ObjectLiteralExpression,
    );
    if (!aliasAssignment || !aliasExpression) {
        throw new Error(
            "Unexpected missing alias property assignment in nextConfig's webpack property",
        );
    }

    Object.entries(alias).forEach(([key, value]) => {
        aliasExpression.addProperty(`'${key}': '${value}'`);
    });

    config.saveSync();
}
