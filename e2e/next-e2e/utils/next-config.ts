import path from 'path';
import { Project, SyntaxKind } from 'ts-morph';

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
