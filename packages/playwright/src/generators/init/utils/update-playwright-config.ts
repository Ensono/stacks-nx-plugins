import { joinPathFragments, ProjectConfiguration } from '@nrwl/devkit';
import { Project, SyntaxKind } from 'ts-morph';

export function updatePlaywrightConfigWithDefault(
    project: ProjectConfiguration,
    morphTree: Project,
) {
    const appNode = morphTree.addSourceFileAtPath(
        joinPathFragments(project.root, 'playwright.config.ts'),
    );

    const playwrightImport = appNode
        .getImportDeclarations()
        .find(
            importDeclaration =>
                importDeclaration.getModuleSpecifier().getLiteralValue() ===
                '@playwright/test',
        );
    playwrightImport.setIsTypeOnly(false);
    playwrightImport.insertNamedImport(0, {
        name: 'devices',
    });

    const config = appNode
        .getVariableDeclaration('config')
        .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

    config.getProperty('projets').remove();

    config.addPropertyAssignments([
        {
            name: 'use',
            initializer: `{
              ...baseConfig.use,
              screenshot: 'only-on-failure',
              trace: 'retain-on-failure',
            }`,
        },
        {
            name: 'projects',
            initializer: `[
              {
                name: 'chromium',
                use: {
                  ...devices['Desktop Chrome'],
                },
              },
              {
                name: 'firefox',
                use: {
                  ...devices['Desktop Firefox'],
                },
              },
          
              {
                name: 'webkit',
                use: {
                  ...devices['Desktop Safari'],
                },
              },
          
              /* Test against mobile viewports. */
              {
                name: 'Mobile Chrome',
                use: {
                  ...devices['Pixel 5'],
                },
              },
              {
                name: 'Mobile Safari',
                use: {
                  ...devices['iPhone 12'],
                },
              },
            ]`,
        },
    ]);

    appNode.saveSync();
}

export function updatePlaywrightConfigWithNativeVisualRegression(
    project: ProjectConfiguration,
    morphTree: Project,
) {
    const appNode = morphTree.addSourceFileAtPath(
        joinPathFragments(project.root, 'playwright.config.ts'),
    );

    const config = appNode
        .getVariableDeclaration('config')
        .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

    config.addPropertyAssignments([
        {
            name: 'updateSnapshots',
            initializer: 'missing',
        },
        {
            name: 'expect',
            initializer: `{
                toHaveScreenshot: {
                  threshold: 0.2,
                  animations: 'disabled',
                },
              }`,
        },
    ]);

    appNode.saveSync();
}

export function updatePlaywrightConfigWithApplitoolsVisualRegression(
    project: ProjectConfiguration,
    morphTree: Project,
) {
    const appNode = morphTree.addSourceFileAtPath(
        joinPathFragments(project.root, 'playwright.config.ts'),
    );

    const config = appNode
        .getVariableDeclaration('config')
        .getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);

    config.addPropertyAssignments([
        {
            name: 'grepInvert',
            initializer: '/.*@visual-regression/',
        },
    ]);

    config
        .getProperty('projects')
        .getFirstChildByKind(SyntaxKind.ArrayLiteralExpression)
        .insertElement(
            0,
            `
        {
          // Applitools project specifically for visual regression
          // This prevents all other projects from unnecessarily repeating applitools tests
          // Retries disabled to prevent unnecessarily repeating a test within applitools following a visual regression
          name: 'applitools',
          grep: /.*@visual-regression/,
          grepInvert: null,
          retries: 0,
        }`,
        );

    console.log(appNode.getText());

    appNode.saveSync();
}
