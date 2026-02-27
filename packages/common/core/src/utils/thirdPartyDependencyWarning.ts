import chalk from 'chalk';

export function thirdPartyDependencyWarning(dependencies: string[]) {
    console.warn(
        chalk.yellow(
            `This generator depends on third party generators listed below:\n${dependencies.join(
                '\n',
            )}`,
        ),
    );
}
