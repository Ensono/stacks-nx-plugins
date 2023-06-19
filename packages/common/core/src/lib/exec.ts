import { exec, execSync, ExecOptions } from 'child_process';

export function execAsync(
    command: string,
    cwd: string,
    options: Omit<ExecOptions, 'env'> = {},
): Promise<unknown> {
    return new Promise((response, reject) => {
        exec(
            command,
            {
                ...options,
                cwd,
                env: { ...process.env, NX_DAEMON: 'false' },
            },
            (error, stdout, stderr) => {
                console.log(stdout);
                if (error) {
                    console.log(stderr);
                    reject(error);
                } else {
                    response(stdout);
                }
            },
        );
    });
}

export function getCommandVersion(command: string) {
    return execSync(`${command} --version`).toString('utf8').trim();
}
