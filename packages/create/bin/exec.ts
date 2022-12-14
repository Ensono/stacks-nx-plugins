import { exec, execSync, ExecOptions } from 'child_process';

export function execAsync(
    command: string,
    cwd: string,
    options: Omit<ExecOptions, 'env'> = {},
) {
    return new Promise((response, reject) => {
        exec(
            command,
            { ...options, cwd, env: { ...process.env, NX_DAEMON: 'false' } },
            (error, stdout, stderr) => {
                if (error) {
                    console.log(error);
                    reject(stderr);
                } else {
                    response(stdout);
                }
            },
        );
    });
}

export function getCommandVersion(command: string) {
    return execSync(`${command} --version`).toString('utf-8').trim();
}
