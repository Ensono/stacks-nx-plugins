import { exec, execSync, ExecOptions } from 'child_process';

export function execAsync(
    command: string,
    cwd: string,
    options: Omit<ExecOptions, 'env'> = {},
) {
    return new Promise((response, reject) => {
        exec(
            command,
            {
                ...options,
                cwd,
                env: { ...process.env, NX_DAEMON: 'false' },
            },
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

export function execSync2(
  command: string,
  cwd: string,
  options: Omit<ExecOptions, 'env'> = {},
) {
  console.log('Executing: ', command)
    try {
        execSync(
          command,
          {
              ...options,
              cwd,
              env: { ...process.env, NX_DAEMON: 'false' },
          },
        );
    } catch (error) {
        console.log(error)
        throw error
    }
}

export function getCommandVersion(command: string) {
    return execSync(`${command} --version`).toString('utf-8').trim();
}
