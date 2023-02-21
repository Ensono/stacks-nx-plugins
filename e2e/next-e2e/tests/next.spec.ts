import { newProject, cleanup } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    runNxCommandAsync,
    uniq,
} from '@nrwl/nx-plugin/testing';

describe('next e2e', () => {
    jest.setTimeout(300_000);
    process.env.HUSKY = '0';

    beforeAll(async () => {
        await newProject(['@ensono-stacks/next'], ['@nrwl/next']);
    });

    afterAll(() => {
        runNxCommandAsync('reset');
        cleanup();
    });

    const project = uniq('nextjs');

    it('runs the install generator', async () => {
        await runNxCommandAsync(
            `generate @nrwl/next:application ${project} --e2eTestRunner=none`,
        );
        await runNxCommandAsync(
            `generate @ensono-stacks/next:init --project=${project} --no-interactive`,
        );

        expect(() =>
            checkFilesExist('tsconfig.base.json', '.eslintrc.json'),
        ).not.toThrow();
    }, 200_000);

    it('can configure NextAuth', async () => {
        await runNxCommandAsync(
            `generate @ensono-stacks/next:next-auth --project=${project} --provider=azureAd --no-interactive`,
        );

        expect(() =>
            checkFilesExist(
                `apps/${project}/pages/api/auth/[...nextauth].ts`,
                `apps/${project}/.env.local`,
            ),
        ).not.toThrow();

        const { stdout } = await runNxCommandAsync(`build ${project}`);

        expect(stdout).toContain('Compiled successfully');
    }, 200_000);

    it('configures NextAuth with Redis adapter', async () => {
        await runNxCommandAsync(
            `generate @ensono-stacks/next:next-auth --project=${project} --provider=azureAd --no-interactive`,
        );
        await runNxCommandAsync(
            `generate @ensono-stacks/next:next-auth-redis --project=${project} --no-interactive`,
        )
        expect(() =>
            checkFilesExist(
                `apps/${project}/pages/api/auth/[...nextauth].ts`,
                `apps/${project}/.env.local`,
                `libs/next-auth-redis/src/index.test.ts`,
                `libs/next-auth-redis/src/index.ts`,
            ),
        ).not.toThrow();

        const result = await runNxCommandAsync('test next-auth-redis');
        expect(result.stderr).not.toEqual(expect.stringContaining('FAIL'));
    }, 200_000);
});
