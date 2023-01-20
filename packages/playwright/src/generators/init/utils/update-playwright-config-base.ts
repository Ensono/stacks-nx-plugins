import { ProjectConfiguration } from '@nrwl/devkit';
import { Project, SyntaxKind } from 'ts-morph';

export function updatePlaywrightConfigBase(morphTree: Project) {
    const appNode = morphTree.addSourceFileAtPath('playwright.config.base.ts');

    appNode
        .getVariableDeclaration('baseURL')
        .getDescendantsOfKind(SyntaxKind.Identifier)
        .find(identifier => identifier.getText() === 'E2E_BASE_URL')
        .replaceWithText('BASE_URL');

    const baseConfig = appNode
        .getVariableDeclaration('baseConfig')
        .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

    baseConfig.getProperty('retries').remove();
    baseConfig.getProperty('maxFailures').remove();
    baseConfig.getProperty('timeout').remove();
    baseConfig.getProperty('use').remove();

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
            name: 'reporter',
            initializer: `process.env.CI
              ? [
                  ['dot'],
                  ['html', { open: 'never' }],
                  ['junit', { outputFile: 'test-results/junit-report.xml' }],
                ]
              : 'list'`,
        },
        {
            name: 'use',
            initializer: '{ baseUrl }',
        },
    ]);

    appNode.saveSync();
}
