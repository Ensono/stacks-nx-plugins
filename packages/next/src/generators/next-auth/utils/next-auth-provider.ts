import { joinPathFragments, ProjectConfiguration } from '@nx/devkit';
import { SyntaxKind, Project } from 'ts-morph';

const azureAdProvider = `AzureADProvider({
    clientId: process.env.AZURE_AD_CLIENT_ID as string,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET as string,
    tenantId: process.env.AZURE_AD_TENANT_ID as string,
})`;

export function addAzureAdProvider(
    project: ProjectConfiguration,
    morphTree: Project,
) {
    const nextAuthNode = morphTree.addSourceFileAtPath(
        joinPathFragments(project.root, 'auth.ts'),
    );

    // Check if the Provider already exists
    const isAzureADImport = nextAuthNode
        .getImportDeclarations()
        .some(
            importDeclaration =>
                importDeclaration.getModuleSpecifier().getLiteralValue() ===
                'next-auth/providers/azure-ad',
        );

    if (!isAzureADImport) {
        nextAuthNode.addImportDeclaration({
            defaultImport: 'AzureADProvider',
            moduleSpecifier: 'next-auth/providers/azure-ad',
        });

        const callExpression = nextAuthNode
            .getDescendantsOfKind(SyntaxKind.CallExpression)
            .find(
                d =>
                    d.getFirstChildByKind(SyntaxKind.Identifier).getText() ===
                    'NextAuth',
            );

        if (!callExpression) {
            throw new Error(
                'Unable to find the NextAuth implementation function.',
            );
        }

        const config = callExpression.getFirstChildByKind(
            SyntaxKind.ObjectLiteralExpression,
        );

        const providerProperty = config
            .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
            .find(
                c =>
                    c
                        .getFirstDescendantByKind(SyntaxKind.Identifier)
                        ?.getText() === 'providers',
            )
            ?.getFirstChildByKind(SyntaxKind.ArrayLiteralExpression);

        if (!providerProperty) {
            config.addProperty(`providers: [${azureAdProvider}]`);
        } else if (
            !providerProperty
                .getDescendantsOfKind(SyntaxKind.Identifier)
                .some(d => d.getText() === 'AzureADProvider')
        ) {
            providerProperty.addElement(azureAdProvider);
        }

        nextAuthNode.saveSync();
    }
}
