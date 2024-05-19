import { tsMorphTree } from '@ensono-stacks/core';
import { joinPathFragments, Tree } from '@nx/devkit';
import {
    MethodDeclaration,
    ObjectLiteralExpression,
    SyntaxKind,
    ImportDeclarationStructure,
    OptionalKind,
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
        joinPathFragments(cypressDirectory, 'src', 'support', 'e2e.ts'),
    );

    if (!appNode.getFunction(functionName)) {
        appNode.addStatements(
            `
import { Result } from 'axe-core';
import addContext from 'mochawesome/addContext';

const cypressGrep = require('@cypress/grep');
cypressGrep();


// Append screenshots on failure to test reports
Cypress.on('test:after:run', (test, runnable) => {
    if (test.state === 'failed') {
        const screenshot = \`../screenshots/\${Cypress.spec.name}/\${runnable.parent?.title} -- \${test.title} (failed).png\`;
        // @ts-ignore
        addContext({ test }, screenshot);
    }
});

export function terminalLogAxe(violations: Result[]) {
    cy.task(
      'log',
      \`\${violations.length} accessibility violation\${violations.length === 1 ? '' : 's'
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
  
    cy.task('table', violationData);
  }
  
        `,
        );

        appNode.save();
    }
}

export function updateCypressConfig(tree: Tree, project: string) {
    const sourceFile = tsMorphTree(tree).addSourceFileAtPath(
        joinPathFragments(project, 'cypress.config.ts'),
    );
    const functionName = 'setupNodeEvents';
    const defineConfigExpression = sourceFile
        .getDescendantsOfKind(SyntaxKind.CallExpression)
        .find(callExpression => {
            const expression = callExpression.getExpression();
            return expression && expression.getText() === 'defineConfig';
        })
        ?.getArguments()[0] as ObjectLiteralExpression;
    if (!defineConfigExpression) {
        throw new Error(
            'No defineConfig was found in the application cypress.config.ts file, have you created this using @ensono-stacks/cypress:init?',
        );
    }

    const requiredProperty = defineConfigExpression
        .getPropertyOrThrow('e2e')
        .asKind(SyntaxKind.PropertyAssignment)
        .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

    const setupNodeEventsMethod: MethodDeclaration =
        requiredProperty
            .getChildrenOfKind(SyntaxKind.MethodDeclaration)
            .find(
                methodDeclaration =>
                    methodDeclaration.getName() === functionName,
            ) ||
        requiredProperty.addMethod({
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
