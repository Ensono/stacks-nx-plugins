import { tsMorphTree } from '@ensono-stacks/core';
import { joinPathFragments, Tree } from '@nrwl/devkit';
import exp from 'constants';
import {
    CallExpression,
    ExportAssignment,
    ExportAssignmentStructure,
    MethodDeclaration,
    Node,
    ObjectLiteralExpression,
    PropertyAssignment,
    SyntaxKind,
} from 'ts-morph';

export const terminalLogAxeBody = `cy.task(
    'log',
    \`\${violations.length} accessibility violation\${
      violations.length === 1 ? '' : 's'
    } \${violations.length === 1 ? 'was' : 'were'} detected\`
  );
  // pluck specific keys to keep the table readable
  const violationData = violations.map(
    ({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      nodes: nodes.length,
    })
  );

  cy.task('table', violationData);`;

export function addTerminalLogging(tree: Tree, cypressDirectory: string) {
    const morphTree = tsMorphTree(tree);
    const functionName = 'terminalLogAxe';
    const appNode = morphTree.addSourceFileAtPath(
        joinPathFragments(cypressDirectory, 'support', 'e2e.ts'),
    );
    if (!appNode.getFunction(functionName)) {
        const functionDeclaration = appNode.addFunction({
            name: functionName,
            isExported: true,
            parameters: [
                {
                    name: 'violations',
                },
            ],
        });
        functionDeclaration.setBodyText(terminalLogAxeBody);
        appNode.save();
    }
}

export function updateCypressConfig(tree: Tree, project: string) {
    const morphTree = tsMorphTree(tree);
    const sourceFile = morphTree.addSourceFileAtPath(
        joinPathFragments(project, 'cypress.config.ts'),
    );
    const callExpressions = sourceFile.getDescendantsOfKind(
        SyntaxKind.CallExpression,
    );
    const functionName = 'setupNodeEvents';
    const defineConfigExpression = callExpressions.find(callExpression => {
        const expression = callExpression.getExpression();
        return expression && expression.getText() === 'defineConfig';
    });
    if (!defineConfigExpression) {
        throw new Error(
            'No defineConfig was found in the application cypress.config.ts file, have you created this using @ensono-stacks/cypress:init?',
        );
    }
    const defineConfigArgument =
        defineConfigExpression?.getArguments()[0] as ObjectLiteralExpression;

    const requiredProperty = defineConfigArgument.getPropertyOrThrow(
        'e2e',
    ) as PropertyAssignment;

    const initializer = requiredProperty.getInitializerIfKindOrThrow(
        SyntaxKind.ObjectLiteralExpression,
    );
    const methods = initializer.getChildrenOfKind(SyntaxKind.MethodDeclaration);
    let setupNodeEventsMethod: MethodDeclaration = methods.find(
        methodDeclaration => methodDeclaration.getName() === functionName,
    );
    if (!setupNodeEventsMethod) {
        setupNodeEventsMethod = initializer.addMethod({
            name: functionName,
            parameters: [
                {
                    name: 'on',
                },
                {
                    name: 'config',
                },
            ],
        });
    }
    setupNodeEventsMethod.insertStatements(
        setupNodeEventsMethod.getStatements().length,
        `
                on('task', {
                  log(message) {
                    console.log(message);
                    return null;
                  },
                  table(message) {
                    console.table(message);
                    return null;
                  },
                });
            `,
    );
    sourceFile.saveSync();
}
