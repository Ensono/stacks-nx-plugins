import { newProject, cleanup } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    runNxCommandAsync,
} from '@nrwl/nx-plugin/testing';

describe('next e2e', () => {
    beforeAll(async () => {
        await newProject(['@ensono-stacks/next'], ['@nrwl/next']);
    });

    afterAll(() => {
        runNxCommandAsync('reset');
        cleanup();
    });

    const project = 'nextjs';

    it('runs the install generator', async () => {
        await runNxCommandAsync(
            `generate @nrwl/app nextjs`
        )
        await runNxCommandAsync(
            `generate @ensono-stacks/next:install --project ${project} --no-interactive`
        );

        expect(() =>
            checkFilesExist(
                'tsconfig.base.json',
                '.eslintrc.json',
            ),
        ).not.toThrow();
    }, 100000);
});
