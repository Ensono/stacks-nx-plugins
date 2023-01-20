import { newProject, cleanup } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    runNxCommandAsync,
    uniq,
} from '@nrwl/nx-plugin/testing';

describe('next e2e', () => {
    beforeAll(async () => {
        await newProject(
            ['@ensono-stacks/next', '@ensono-stacks/core'],
            ['@nrwl/next'],
        );
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
});
