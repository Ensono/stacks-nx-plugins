import { tsMorphTree } from '@ensono-stacks/core';
import { joinPathFragments, Tree } from '@nrwl/devkit';
import { SyntaxKind } from 'ts-morph';

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

export function updateCypressConfig(tree: Tree, project: string){
    const morphTree = tsMorphTree(tree);
    const appNode = morphTree.addSourceFileAtPath(
        joinPathFragments(project, 'cypress.config.ts'),
    );
    const statements = appNode.getStatements();
    const exporAs = appNode.getExportAssignments()[0].getStructure();
        // figure out what to do with this export assignment

    console.log(config);
}
