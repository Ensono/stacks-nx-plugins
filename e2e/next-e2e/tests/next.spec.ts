import { newProject, cleanup } from '@ensono-stacks/e2e';
import {
    checkFilesExist,
    runNxCommand,
    runNxCommandAsync,
    uniq,
} from '@nrwl/nx-plugin/testing';

describe('next e2e', () => {
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
            `generate @nrwl/next:application ${project}`
        )
        await runNxCommandAsync(
            `generate @ensono-stacks/next:init --project=${project} --no-interactive`
        )

        expect(() =>
            checkFilesExist(
                'tsconfig.base.json',
                '.eslintrc.json',
            ),
        ).not.toThrow();
    });
});
