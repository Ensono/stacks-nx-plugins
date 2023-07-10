import { newProject, cleanup, createNextApplication, runTarget, targetOptions } from '@ensono-stacks/e2e';
import { checkFilesExist, runNxCommandAsync, uniq } from '@nx/plugin/testing';

describe('next e2e', () => {
    jest.setTimeout(1_000_000);
    process.env.HUSKY = '0';
    const project = 'nextjs2537935'; //uniq('nextjs');

    beforeAll(async () => {
        // await newProject('@ensono-stacks/next', ['@nx/next']);
        // await createNextApplication(project);
    });

    afterAll(() => {
        runNxCommandAsync('reset');
    });

    describe('init generator', () =>{

        it('runs the install generator', async () => {
            expect(() =>
                checkFilesExist('tsconfig.base.json', '.eslintrc.json'),
            ).not.toThrow();
        }, 200_000);

        it('serves the application', async () => {
            expect(await runTarget(project, targetOptions.serve)).toBeTruthy();
        })
    })

    

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

        expect(runTarget(project, targetOptions.build)).toBe('Compiled successfully');
    }, 200_000);

    // it('configures NextAuth with Redis adapter', async () => {
    //     await runNxCommandAsync(
    //         `generate @ensono-stacks/next:next-auth --project=${project} --provider=azureAd --no-interactive`,
    //     );
    //     await runNxCommandAsync(
    //         `generate @ensono-stacks/next:next-auth-redis --project=${project} --no-interactive`,
    //     );
    //     expect(() =>
    //         checkFilesExist(
    //             `apps/${project}/pages/api/auth/[...nextauth].ts`,
    //             `apps/${project}/.env.local`,
    //             `libs/next-auth-redis/src/index.test.ts`,
    //             `libs/next-auth-redis/src/index.ts`,
    //         ),
    //     ).not.toThrow();

    //     const result = await runNxCommandAsync('test next-auth-redis');
    //     expect(result.stderr).not.toEqual(expect.stringContaining('FAIL'));
    // }, 200_000);
});
