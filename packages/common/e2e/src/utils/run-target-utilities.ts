import { getPackageManagerCommand } from '@nx/devkit';
import { runNxCommandAsync, tmpProjPath } from '@nx/plugin/testing';
import { ChildProcess, exec } from 'child_process';

import { killPort } from './process-utilities';

export enum targetOptions {
    build,
    start,
    test,
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
        // eslint-disable-next-line no-control-regex
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        '',
    );
}

export async function runCommandUntil(
    command: string,
    criteria: (output: string) => boolean,
): Promise<ChildProcess> {
    const pm = getPackageManagerCommand();

    const p = exec(`${pm.exec} nx ${command}`, {
        cwd: tmpProjPath(),
        encoding: 'utf8',
        env: {
            ...process.env,
            CI: 'true',
            FORCE_COLOR: 'false',
        },
        windowsHide: true,
    });

    await new Promise<void>((response, reject) => {
        let output = '';
        let complete = false;

        function checkCriteria(c: { toString: () => string }) {
            output += c.toString();

            if (criteria(stripConsoleColors(output)) && !complete) {
                console.log(output);
                complete = true;
                response();
            } else if (output.includes('Error:')) {
                reject(
                    new Error(`Error detected running command: \n${output}`),
                );
            }
        }

        p.stdout?.on('data', checkCriteria);
        p.stderr?.on('data', checkCriteria);
        p.on('close', code => {
            if (complete) {
                response();
            } else {
                console.error(`Original output:
                ${output
                    .split('\n')
                    .map(l => `    ${l}`)
                    .join('\n')}`);
                reject(new Error(`Exited with ${code}`));
            }
        });
    });

    return p;
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

        project = splitString[0];

        subProject = splitString[1];
        command = `run ${project}:${targetOptions[target]}:${subProject}${additionalArguments}`;
    } else {
        command = `run ${project}:${targetOptions[target]}${additionalArguments}`;
    }
    let silenceError = true;

    switch (target) {
        case targetOptions.build:
        case targetOptions.test:
        case targetOptions.e2e:
        case targetOptions['html-report']:
        case targetOptions.lint:
        case targetOptions.storybook: {
            if (targetOptions.build === target) {
                silenceError = false;
            }
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
            let serverProcess: ChildProcess | undefined;

            try {
                serverProcess = await runCommandUntil(
                    `${command} --port=${appPort} --verbose`,
                    output => {
                        return output.includes(`localhost:${appPort}`);
                    },
                );
            } finally {
                // Signal the process to terminate gracefully
                if (serverProcess) {
                    const result = serverProcess.kill('SIGTERM');

                    console.log(`Process kill result: ${result}`);
                    if (!result) {
                        // Fallback: kill by port if process didn't release it
                        await killPort(appPort);
                    }
                }
                // Give the process time to shut down
                await new Promise(done => setTimeout(done, 2000));
            }

            return true;
        }
        default: {
            throw new Error(`${target} is not a valid target option`);
        }
    }
}
