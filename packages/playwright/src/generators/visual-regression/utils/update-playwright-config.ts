import { joinPathFragments, ProjectConfiguration } from '@nx/devkit';
import { Project, SyntaxKind, Node } from 'ts-morph';

const baseConfigPropertyAssignments = [
    {
        name: 'updateSnapshots',
        initializer: `'missing'`,
    },
    {
        name: 'ignoreSnapshots',
        initializer: '!process.env.CI',
    },
    {
        name: 'expect',
        initializer: `{
        toHaveScreenshot: {
          maxDiffPixelRatio: 0.05,
          threshold: 0.2,
          animations: 'disabled',
        },
        toMatchSnapshot: {
          maxDiffPixelRatio: 0.05,
          threshold: 0.2,
        },
      }`,
    },
];

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

    if (
        !playwrightImport
            .getNamedImports()
            ?.some(modules => modules.getName() === 'devices')
    ) {
        playwrightImport.insertNamedImport(0, {
            name: 'devices',
        });
    }

    const callExpressions = appNode.getDescendantsOfKind(
        SyntaxKind.CallExpression,
    );
    const defineConfigCallExpression = callExpressions.find(
        callExpression =>
            callExpression.getExpression().getText() === 'defineConfig',
    );
    const config = defineConfigCallExpression.getArguments()[0];

    if (!Node.isObjectLiteralExpression(config)) {
        throw new Error('First argument is not an ObjectLiteralExpression');
    }

    config.getProperty('use')?.remove();
    config.getProperty('projects')?.remove();

    config.addPropertyAssignments([
        ...baseConfigPropertyAssignments,
        {
            name: 'use',
            initializer: `{
              baseURL,
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

export function updatePlaywrightConfigWithApplitoolsVisualRegression(
    project: ProjectConfiguration,
    morphTree: Project,
) {
    const appNode = morphTree.addSourceFileAtPath(
        joinPathFragments(project.root, 'playwright.config.ts'),
    );
    const callExpressions = appNode.getDescendantsOfKind(
        SyntaxKind.CallExpression,
    );
    const defineConfigCallExpression = callExpressions.find(
        callExpression =>
            callExpression.getExpression().getText() === 'defineConfig',
    );
    const config = defineConfigCallExpression.getArguments()[0];

    if (!Node.isObjectLiteralExpression(config)) {
        throw new Error('First argument is not an ObjectLiteralExpression');
    }

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
          grepInvert: undefined,
          retries: 0,
        }`,
        );

    appNode.saveSync();
}
