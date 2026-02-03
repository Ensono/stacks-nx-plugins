import { runNxCommandAsync, tmpProjPath } from '@nx/plugin/testing';
import { exec } from 'child_process';

import { killPort } from './process-utils';

export enum targetOptions {
    build,
    start,
    test,
    // eslint-disable-next-line unicorn/prevent-abbreviations
    e2e,
    lint,
    'html-report',
    storybook,
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
    includesMessage = 'compiled client and server successfully',
    additionalArguments = '',
) {
    let command;
    let subProject;
    if (project.includes(':')) {
        const splitString = project.split(':');
        // eslint-disable-next-line prefer-destructuring, no-param-reassign
        project = splitString[0];
        // eslint-disable-next-line prefer-destructuring
        subProject = splitString[1];
        command = `${targetOptions[target]} ${project}:${subProject} ${additionalArguments}`;
    } else {
        command = `${targetOptions[target]} ${project} ${additionalArguments}`;
    }
    let silenceError = true;
    switch (target) {
        case targetOptions.build: {
            silenceError = false;
        }
        // eslint-disable-next-line no-fallthrough
        case targetOptions.test:
        case targetOptions.e2e:
        case targetOptions['html-report']:
        case targetOptions.lint:
        case targetOptions.storybook: {
            const { stdout, stderr } = await runNxCommandAsync(
                `${command} --skip-nx-cache`,
                {
                    silenceError,
                    cwd: tmpProjPath(),
                },
            );
            return stripConsoleColors(`${stdout}\n${stderr}`);
        }
        case targetOptions.start: {
            const appPort = 4000;
            const redisPort = 6379;
            try {
                await runCommandUntil(
                    `${command} --port=${appPort} --verbose`,
                    output => {
                        return output.includes(`localhost:${appPort}`);
                    },
                );
            } finally {
                await killPort(appPort);
                await killPort(redisPort);
            }
            return true;
        }
        default: {
            throw new Error(`${target} is not a valid target option`);
        }
    }
}
