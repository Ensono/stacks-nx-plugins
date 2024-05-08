import { joinPathFragments, ProjectConfiguration } from '@nx/devkit';
import { SyntaxKind, Project } from 'ts-morph';

import { REACT_QUERY_NPM_PACKAGE_NAME } from './constants';

export function addQueryClientProviderToApp(
    project: ProjectConfiguration,
    morphTree: Project,
) {
    const appNode = morphTree.addSourceFileAtPath(
        joinPathFragments(project.root, 'src', 'app', 'providers.tsx'),
    );

    // Check if the App Already contains react-query
    const isReactQueryImport = appNode
        .getImportDeclarations()
        .some(
            importDeclaration =>
                importDeclaration.getModuleSpecifier().getLiteralValue() ===
                REACT_QUERY_NPM_PACKAGE_NAME,
        );

    if (!isReactQueryImport) {
        appNode.getSourceFile().insertImportDeclaration(0, {
            namedImports: ['QueryClient', 'QueryClientProvider'],
            moduleSpecifier: REACT_QUERY_NPM_PACKAGE_NAME,
        });

        appNode.getSourceFile().insertStatements(
            1,
            `
            function makeQueryClient() {
                return new QueryClient({
                  defaultOptions: {
                    queries: {
                      // With SSR, we usually want to set some default staleTime
                      // above 0 to avoid refetching immediately on the client
                      staleTime: 60 * 1000,
                    },
                  },
                })
              }
              
              let browserQueryClient: QueryClient | undefined = undefined
              
              function getQueryClient() {
                if (typeof window === 'undefined') {
                  // Server: always make a new query client
                  return makeQueryClient()
                } else {
                  // Browser: make a new query client if we don't already have one
                  // This is very important so we don't re-make a new client if React
                  // suspends during the initial render. This may not be needed if we
                  // have a suspense boundary BELOW the creation of the query client
                  if (!browserQueryClient) browserQueryClient = makeQueryClient()
                  return browserQueryClient
                }
              }
            `,
        );

        // get default export node reference
        const defaultExport = appNode
            .getExportAssignmentOrThrow(d => !d.isExportEquals())
            .getExpression()
            .getText();
        const main = appNode.getFunction(defaultExport);

        // Add the QueryClientProvider
        const content = main
            .getDescendantsOfKind(SyntaxKind.ReturnStatement)
            .pop()
            .getFirstChildByKind(SyntaxKind.ParenthesizedExpression)
            .getChildAtIndex(1);

        const update = content.isKind(SyntaxKind.JsxFragment)
            ? content
                  .getJsxChildren()
                  .map(c => c.getText())
                  .join('')
            : content.getText();

        content.replaceWithText(
            `
            // NOTE: Avoid useState when initializing the query client if you don't
            //       have a suspense boundary between this and the code that may
            //       suspend because React will throw away the client on the initial
            //       render if it suspends and there is no boundary
            const queryClient = getQueryClient()

            <QueryClientProvider client={queryClient}>
                ${update}
            </QueryClientProvider>`,
        );

        appNode.saveSync();
    }
}
