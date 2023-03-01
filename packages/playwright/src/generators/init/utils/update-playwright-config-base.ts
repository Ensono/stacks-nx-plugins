import { Project, SyntaxKind, VariableDeclarationKind } from 'ts-morph';

export function updatePlaywrightConfigBase(
    morphTree: Project,
    targetProject: string,
) {
    const appNode = morphTree.addSourceFileAtPath('playwright.config.base.ts');

    appNode
        .getVariableDeclaration('baseURL')
        .getDescendantsOfKind(SyntaxKind.Identifier)
        .find(identifier => identifier.getText() === 'E2E_BASE_URL')
        ?.replaceWithText('BASE_URL');

    appNode.insertVariableStatement(
        appNode.getVariableDeclaration('baseURL').getChildIndex() + 1,
        {
            declarationKind: VariableDeclarationKind.Const,
            declarations: [
                {
                    name: 'outputFolderForProject',
                    initializer:
                        // eslint-disable-next-line no-template-curly-in-string
                        "process.env.CI ? `../../test-results/${appName}` : 'test-results'",
                },
            ],
        },
    );
    appNode.insertVariableStatement(
        appNode.getVariableDeclaration('baseURL').getChildIndex() + 1,
        {
            declarationKind: VariableDeclarationKind.Const,
            declarations: [
                {
                    name: 'appName',
                    initializer: `process.env.NX_TASK_TARGET_PROJECT || '${targetProject}'`,
                },
            ],
        },
    );

    const baseConfig = appNode
        .getVariableDeclaration('baseConfig')
        .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

    baseConfig.getProperty('retries')?.remove();
    baseConfig.getProperty('maxFailures')?.remove();
    baseConfig.getProperty('timeout')?.remove();
    baseConfig.getProperty('use')?.remove();
    baseConfig.getProperty('fullyParallel')?.remove();
    baseConfig.getProperty('forbidOnly')?.remove();
    baseConfig.getProperty('reporter')?.remove();

    baseConfig.addPropertyAssignments([
        {
            name: 'fullyParallel',
            initializer: 'true',
        },
        {
            name: 'forbidOnly',
            initializer: '!!process.env.CI',
        },
        {
            name: 'retries',
            initializer: 'process.env.CI ? 2 : undefined',
        },
        {
            name: 'maxFailures',
            initializer: 'process.env.CI ? 10 : undefined',
        },
        {
            name: 'timeout',
            initializer: '30000',
        },
        {
            name: 'outputDir',
            initializer: 'outputFolderForProject',
        },
        {
            name: 'reporter',
            initializer: `process.env.CI
              ? [
                  ['dot'],
                  ['html', { open: 'never', outputFolder: outputFolderForProject.concat('/html-report') }],
                  ['junit', { outputFile: outputFolderForProject.concat('/', appName, '.xml') }],
                ]
              : 'list'`,
        },
        {
            name: 'use',
            initializer: '{ baseURL }',
        },
    ]);

    appNode.saveSync();
}
