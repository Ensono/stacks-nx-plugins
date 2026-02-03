import { addStacksAttributes } from '@ensono-stacks/test';
import { Tree, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/next';

import generator from './generator';
import { NextAuthGeneratorSchema } from './schema';

const name = 'auth';
const project = 'next-app';

function getGeneratorOptions(
    options: Partial<NextAuthGeneratorSchema> = {},
): NextAuthGeneratorSchema {
    return {
        name,
        project,
        directory: '',
        provider: 'none',
        sessionStorage: 'cookie',
        guestSession: false,
        projectNameAndRootFormat: 'derived',
        ...options,
    };
}

describe('next-auth generator', () => {
    let appTree: Tree;

    beforeEach(async () => {
        appTree = createTreeWithEmptyWorkspace();
        await applicationGenerator(appTree, {
            name: 'next-app',
            style: 'css',
            directory: 'next-app',
        });

        addStacksAttributes(appTree, project);
    });

    describe('Library scaffolding', () => {
        beforeEach(async () => {
            await generator(appTree, getGeneratorOptions());
        });

        it('should install auth library', async () => {
            const packageJson = readJson(appTree, 'package.json');

            expect(Object.keys(packageJson.dependencies)).toEqual(
                expect.arrayContaining(['next-auth']),
            );

            const libraryIndexContent = appTree.read('auth/src/index.ts');

            expect(libraryIndexContent.toString()).toMatchSnapshot();
        });

        it('should update target project', async () => {
            expect(appTree.exists('next-app/.env.local')).toBeTruthy();

            expect(
                appTree.exists(
                    'next-app/src/app/api/auth/[...nextauth]/route.ts',
                ),
            ).toBeTruthy();
        });
    });

    describe('sessionStorage', () => {
        describe('cookies', () => {
            beforeEach(async () => {
                await generator(
                    appTree,
                    getGeneratorOptions({ sessionStorage: 'cookie' }),
                );
            });

            it('should have no configued adapter', () => {
                const libraryIndexContent = appTree.read('auth/src/index.ts');

                expect(libraryIndexContent.toString()).not.toContain(
                    'adapter,',
                );
            });

            it('should match expected callbacks', () => {
                const jwtIndexContent = appTree.read(
                    'auth/src/callbacks/jwt.ts',
                );
                const sessionIndexContent = appTree.read(
                    'auth/src/callbacks/session.ts',
                );

                expect(jwtIndexContent.toString()).toMatchSnapshot();
                expect(sessionIndexContent.toString()).toMatchSnapshot();
            });
        });

        describe('redis', () => {
            beforeEach(async () => {
                await generator(
                    appTree,
                    getGeneratorOptions({ sessionStorage: 'redis' }),
                );
            });

            it('should have a configued adapter', () => {
                const libraryIndexContent = appTree.read('auth/src/index.ts');

                expect(libraryIndexContent.toString()).toContain('adapter,');

                expect(
                    appTree.exists('auth/src/adapter/index.ts'),
                ).toBeTruthy();
            });

            it('should match expected callbacks', () => {
                const jwtIndexContent = appTree.read(
                    'auth/src/callbacks/jwt.ts',
                );
                const sessionIndexContent = appTree.read(
                    'auth/src/callbacks/session.ts',
                );

                expect(jwtIndexContent.toString()).toMatchSnapshot();
                expect(sessionIndexContent.toString()).toMatchSnapshot();
            });
        });
    });

    describe('providers', () => {
        describe('auth0', () => {
            beforeEach(async () => {
                await generator(
                    appTree,
                    getGeneratorOptions({ provider: 'auth0' }),
                );
            });

            it('creates the provider', () => {
                expect(
                    appTree.exists('auth/src/providers/auth0.ts'),
                ).toBeTruthy();
                expect(
                    appTree.read('auth/src/providers/auth0.ts').toString(),
                ).toMatchSnapshot();

                expect(
                    appTree.read('next-app/.env.local').toString(),
                ).toContain('AUTH0_CLIENT_ID=');
                expect(
                    appTree.read('next-app/.env.local').toString(),
                ).toContain('AUTH0_CLIENT_SECRET=');
                expect(
                    appTree.read('next-app/.env.local').toString(),
                ).toContain('AUTH0_ISSUER=');

                expect(
                    appTree.read('auth/src/providers/index.ts').toString(),
                ).toMatchSnapshot();
            });
        });

        describe('microsoft-entra-id', () => {
            beforeEach(async () => {
                await generator(
                    appTree,
                    getGeneratorOptions({ provider: 'microsoft-entra-id' }),
                );
            });

            it('creates the provider', () => {
                expect(
                    appTree.exists('auth/src/providers/microsoft-entra-id.ts'),
                ).toBeTruthy();
                expect(
                    appTree
                        .read('auth/src/providers/microsoft-entra-id.ts')
                        .toString(),
                ).toMatchSnapshot();

                expect(
                    appTree.read('next-app/.env.local').toString(),
                ).toContain('AZURE_ENTRAID_ID=');
                expect(
                    appTree.read('next-app/.env.local').toString(),
                ).toContain('AZURE_ENTRAID_SECRET=');
                expect(
                    appTree.read('next-app/.env.local').toString(),
                ).toContain('AZURE_ENTRAID_TENANT=');

                expect(
                    appTree.read('auth/src/providers/index.ts').toString(),
                ).toMatchSnapshot();
            });
        });
    });

    describe('guest session', () => {
        describe('cookie', () => {
            beforeEach(async () => {
                await generator(
                    appTree,
                    getGeneratorOptions({
                        provider: 'auth0',
                        guestSession: true,
                        sessionStorage: 'cookie',
                    }),
                );
            });

            it('matches callback snapshots', () => {
                const jwtIndexContent = appTree.read(
                    'auth/src/callbacks/jwt.ts',
                );
                const sessionIndexContent = appTree.read(
                    'auth/src/callbacks/session.ts',
                );

                expect(jwtIndexContent.toString()).toMatchSnapshot();
                expect(sessionIndexContent.toString()).toMatchSnapshot();
            });

            it('creates next component for guest session', () => {
                expect(
                    appTree.exists('next-app/src/components/guest-session.tsx'),
                ).toBeTruthy();
            });
        });

        describe('redis', () => {
            beforeEach(async () => {
                await generator(
                    appTree,
                    getGeneratorOptions({
                        provider: 'auth0',
                        guestSession: true,
                        sessionStorage: 'redis',
                    }),
                );
            });

            it('matches callback snapshots', () => {
                const jwtIndexContent = appTree.read(
                    'auth/src/callbacks/jwt.ts',
                );
                const sessionIndexContent = appTree.read(
                    'auth/src/callbacks/session.ts',
                );

                expect(jwtIndexContent.toString()).toMatchSnapshot();
                expect(sessionIndexContent.toString()).toMatchSnapshot();
            });

            it('adds const for session cookie', () => {
                const configContent = appTree.read('auth/src/config.ts');

                expect(configContent.toString()).toContain(
                    'GUEST_SESSION_COOKIE_NAME',
                );
            });
        });
    });

    it('should skip installing depndencies', async () => {
        await generator(appTree, {
            ...getGeneratorOptions({ skipPackageJson: true }),
            skipPackageJson: true,
        });

        const packageJson = readJson(appTree, 'package.json');

        expect(Object.keys(packageJson.dependencies)).not.toEqual(
            expect.arrayContaining(['next-auth']),
        );
    });
});
