import { Tree, readJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/next';

import generator from './generator';
import { NextAuthGeneratorSchema } from './schema';

describe('next-auth generator', () => {
    let appTree: Tree;
    const options: NextAuthGeneratorSchema = {
        project: 'next-app',
        provider: 'azureAd',
    };

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        await applicationGenerator(appTree, {
            name: 'next-app',
            style: 'css',
            standaloneConfig: false,
        });
    });

    it('should install NextAuth without a provider', async () => {
        await generator(appTree, { ...options, provider: 'none' });

        const packageJson = readJson(appTree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).toEqual(
            expect.arrayContaining(['next-auth']),
        );

        expect(appTree.exists('next-app/.env.local')).toBeTruthy();
        expect(
            appTree.exists('next-app/pages/api/[...nextauth].ts'),
        ).toBeTruthy();

        const appTs = appTree.read('next-app/pages/_app.tsx');

        expect(appTs.toString()).toContain(
            '<SessionProvider session={session}>',
        );
        expect(appTs.toString()).toContain('</SessionProvider>');
    });

    it('should configure app if there are already wrapping react providers', async () => {
        const app = `function SomeProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}
function CustomApp({
  Component,
  pageProps,
}: AppProps) {
  return (
      <SomeProvider>
          <Component {...pageProps} />
      </SomeProvider>
  );
}
export default CustomApp;
`;

        appTree.write('next-app/pages/_app.tsx', app);
        await generator(appTree, options);

        const AppTsx = appTree.read('next-app/pages/_app.tsx');

        expect(AppTsx.toString()).toContain(`function CustomApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
      <SessionProvider session={session}>
      <SomeProvider>`);
    });

    it('should configure app if pageProps is already destructured', async () => {
        const app = `function SomeProvider({ children }: PropsWithChildren) {
return <>{children}</>;
}
function CustomApp({
Component,
pageProps: { something, ...pageProperties },
}: AppProps) {
return (
    <SomeProvider>
        <Component {...pageProperties} />
    </SomeProvider>
);
}
export default CustomApp;
`;

        appTree.write('next-app/pages/_app.tsx', app);
        await generator(appTree, options);

        const AppTsx = appTree.read('next-app/pages/_app.tsx');

        expect(AppTsx.toString()).toContain(`function CustomApp({
Component,
pageProps: { session, something, ...pageProperties },
}: AppProps) {
return (
    <SessionProvider session={session}>
    <SomeProvider>
            <Component {...pageProperties} />`);
    });

    it('should install NextAuth with a provider', async () => {
        await generator(appTree, options);

        const nextAuthTs = appTree.read('next-app/pages/api/[...nextauth].ts');

        expect(nextAuthTs.toString()).toContain(
            `import AzureADProvider from "next-auth/providers/azure-ad"`,
        );

        expect(
            (nextAuthTs.toString().match(/AzureADProvider/g) || []).length,
        ).toBe(2);
    });

    it('should safely run on an existing NextAuth install', async () => {
        await generator(appTree, options);
        await generator(appTree, options);

        const nextAuthTs = appTree.read('next-app/pages/api/[...nextauth].ts');

        expect(nextAuthTs.toString()).toContain(
            `import AzureADProvider from "next-auth/providers/azure-ad"`,
        );

        expect(
            (nextAuthTs.toString().match(/AzureADProvider/g) || []).length,
        ).toBe(2);
    });

    it('should error if an existing NextAuth install is not valid', async () => {
        appTree.write('next-app/pages/api/[...nextauth].ts', '');
        await expect(generator(appTree, options)).rejects.toThrowError(
            'Unable to find the NextAuth implementation function.',
        );
    });

    it('should run on an existing NextAuth install with no providers', async () => {
        const config = `import NextAuth from 'next-auth';
const nextAuth = NextAuth({});
default export nextAuth;
`;
        appTree.write('next-app/pages/api/[...nextauth].ts', config);
        await generator(appTree, options);

        const nextAuthTs = appTree.read('next-app/pages/api/[...nextauth].ts');

        expect(nextAuthTs.toString()).toContain(
            'providers: [AzureADProvider({',
        );
    });

    it('should appendto an existing list of providers', async () => {
        const config = `import NextAuth from 'next-auth';
const nextAuth = NextAuth({
  providers: [
    GithubProvider({})
  ]
});
default export nextAuth;
`;
        appTree.write('next-app/pages/api/[...nextauth].ts', config);
        await generator(appTree, options);

        const nextAuthTs = appTree.read('next-app/pages/api/[...nextauth].ts');

        expect(nextAuthTs.toString()).toContain(
            `  providers: [
    GithubProvider({}),
        AzureADProvider({`,
        );
    });

    it('should append to an existing .env.local', async () => {
        appTree.write('next-app/.env.local', 'NEXTAUTH_URL=http://website.com');
        await generator(appTree, options);
        const localEnv = appTree.read('next-app/.env.local');
        expect(localEnv.toString()).toContain(
            'NEXTAUTH_URL=http://website.com',
        );
        expect(localEnv.toString()).not.toContain(
            'NEXTAUTH_URL=http://localhost:4200',
        );
    });

    it('should skip installing depndencies', async () => {
        await generator(appTree, { ...options, skipPackageJson: true });

        const packageJson = readJson(appTree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).not.toEqual(
            expect.arrayContaining(['next-auth']),
        );
    });
});
