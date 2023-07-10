import {
    runNxCommandAsync,
    runNxCommand,
    tmpProjPath,
} from '@nx/plugin/testing';
import { ChildProcess, exec } from 'child_process';
import { Console } from 'console';
import { stdout } from 'process';

import { killPort } from './process-utils';

export enum targetOptions {
    build,
    serve,
    test,
}

/**
 * Remove log colors for fail proof string search
 * @param log
 * @returns
 */
export function stripConsoleColors(log: string): string {
    return log?.replace(
        // eslint-disable-next-line no-control-regex, security/detect-unsafe-regex, prettier/prettier, unicorn/better-regex, unicorn/escape-case
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        '',
    );
}

export function runCommandUntil(
    command: string,
    criteria: (output: string) => boolean,
): Promise<ChildProcess> {
    console.log(`Running the following command: ${command}`);
    // eslint-disable-next-line security/detect-child-process
    const p = exec(`npx nx ${command}`, {
        cwd: tmpProjPath(),
        encoding: 'utf8',
    });
    return new Promise((response, rej) => {
        let output = '';
        let complete = false;

        function checkCriteria(c) {
            output += c.toString();
            if (criteria(stripConsoleColors(output)) && !complete) {
                console.log(output);
                complete = true;
                response(p);
            } else if (output.includes('Error:')) {
                rej(new Error(`Error detected during serve`));
            }
        }

        p.stdout?.on('data', checkCriteria);
        p.stderr?.on('data', checkCriteria);
        p.on('exit', code => {
            if (complete) {
                response(p);
            } else {
                console.error(`Original output:
                ${output
                    .split('\n')
                    .map(l => `    ${l}`)
                    .join('\n')}`);
                // eslint-disable-next-line prefer-promise-reject-errors
                rej(`Exited with ${code}`);
            }
        });
    });
}

export async function runTarget(project: string, target: targetOptions) {
    const command = `${targetOptions[target]} ${project}`;
    const port = 4000;
    switch (target) {
        case targetOptions.build:
        case targetOptions.test: {
            const logs = runNxCommand(command);
            return stripConsoleColors(logs);
        }
        case targetOptions.serve: {
            try {
                await runCommandUntil(
                    `${command} --port=${port} --verbose`,
                    output => {
                        return (
                            output.includes(`localhost:${port}`) &&
                            output.includes(
                                'compiled client and server successfully',
                            )
                        );
                    },
                );
            } finally {
                await killPort(port);
            }
            return true;
        }
        default: {
            throw new Error(`${target} is not a valid target option`);
        }
    }
}
