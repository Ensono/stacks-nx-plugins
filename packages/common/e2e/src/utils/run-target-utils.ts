import { runNxCommandAsync, tmpProjPath } from '@nx/plugin/testing';
import { exec } from 'child_process';

import { killPort } from './process-utils';

export enum targetOptions {
    build,
    serve,
    test,
    // eslint-disable-next-line unicorn/prevent-abbreviations
    e2e,
    lint,
}

/**
 * Remove log colors for fail proof string search
 * @param log
 * @returns
 */
export function stripConsoleColors(logs: string): string {
    return logs?.replace(
        // eslint-disable-next-line no-control-regex, security/detect-unsafe-regex, prettier/prettier, unicorn/better-regex, unicorn/escape-case
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        '',
    );
}

export async function runCommandUntil(
    command: string,
    criteria: (output: string) => boolean,
) {
    // eslint-disable-next-line security/detect-child-process
    const p = exec(`npx nx ${command}`, {
        cwd: tmpProjPath(),
        encoding: 'utf8',
    });
    await new Promise((response, rej) => {
        let output = '';
        let complete = false;

        function checkCriteria(c: { toString: () => string }) {
            output += c.toString();

            if (criteria(stripConsoleColors(output)) && !complete) {
                console.log(output);
                complete = true;
                response(p);
            } else if (output.includes('Error:')) {
                rej(new Error(`Error detected running command: \n${output}`));
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
                rej(new Error(`Exited with ${code}`));
            }
        });
    }).finally(() => {
        p.kill();
    });
}

export async function runTarget(
    project: string,
    target: targetOptions,
    additionalArguments = '',
) {
    const command = `${targetOptions[target]} ${project} `;
    let silenceError = true;
    switch (target) {
        case targetOptions.build: {
            silenceError = false;
        }
        // eslint-disable-next-line no-fallthrough
        case targetOptions.test:
        case targetOptions.e2e:
        case targetOptions.lint: {
            const { stdout, stderr } = await runNxCommandAsync(
                `${command} --skip-nx-cache ${additionalArguments}`,
                {
                    silenceError,
                },
            );
            return stripConsoleColors(`${stdout}\n${stderr}`);
        }
        case targetOptions.serve: {
            await runTarget(project, targetOptions.build);
            const port = 4000;
            try {
                await runCommandUntil(
                    `${command} --port=${port} --verbose ${additionalArguments}`,
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
