import initPlaywrightGenerator from '@mands/nx-playwright/src/generators/project/generator';
import { NxPlaywrightGeneratorSchema } from '@mands/nx-playwright/src/generators/project/schema-types';
import { Tree } from '@nrwl/devkit';

import { execAsync } from './exec';

export async function playwrightInit(
    cwd: string,
    appTree: Tree,
    options: NxPlaywrightGeneratorSchema,
) {
    await execAsync(`npm i -D @mands/nx-playwright`, cwd);
    await execAsync('npx playwright install --with-deps', cwd);
    await execAsync('npm i -D @ensono-stacks/playwright', cwd);
    await initPlaywrightGenerator(appTree, options);
}
