import { logger } from '@nrwl/devkit';
import { spawnSync } from 'child_process';

export function formatFilesWithEslint(project: string) {
    return () => {
        const { stdout, stderr } = spawnSync(
            'npx',
            ['nx', 'lint', project, '--fix'],
            {
                env: { ...process.env, FORCE_COLOR: '3' },
                shell: true,
            },
        );

        if (stderr.toString()) {
            logger.log(stdout.toString());
        }
    };
}
