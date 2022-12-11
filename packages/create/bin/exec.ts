import { exec, ExecOptions } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';

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
                    // const logFile = path.join(cwd, 'error.log');
                    // writeFileSync(logFile, `${stdout}\n${stderr}`);
                    // reject({ code: error.code, logFile, logMessage: stderr });
                    reject(error);
                } else {
                    response({ code: 0, stdout });
                }
            },
        );
    });
}
