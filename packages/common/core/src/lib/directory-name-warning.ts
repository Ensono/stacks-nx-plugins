import chalk from 'chalk';

import { NormalizedSchema } from './normalize-options';

/**
 * Check if --directory option was passed to the generator and
 * issue a warning about generated project name, if necessary.
 *
 * @param options Previously normalized generator options.
 */
export function warnDirectoryProjectName(options: NormalizedSchema) {
    if (options.directory) {
        console.log(
            chalk.yellow`NOTE: you passed --directory=${options.directory} to the generator, which means that the library is now called ${options.projectName}`,
        );
        console.log(
            chalk.yellow`      Remember this when running nx commands like "nx test ${options.projectName}"`,
        );
    }
}
