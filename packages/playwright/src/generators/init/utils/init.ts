import { execAsync } from './exec';

export async function playwrightInit(cwd: string, projectName: string) {
    await execAsync(`npm i -D @mands/nx-playwright`, cwd);
    await execAsync('npm i -D playwright', cwd);
    await execAsync('npx playwright install --with-deps', cwd);
    await execAsync(
        `npx nx generate @mands/nx-playwright:project ${projectName} --packageRunner=npx --no-interactive`,
        cwd,
    );
    await execAsync('npm i -D @ensono-stacks/playwright', cwd);
}
