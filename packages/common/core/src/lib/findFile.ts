import fs from 'fs';
import path from 'path';

/**
 *
 * @param {number} fileName Name of the file
 * @param {number} targetDirectory Url path of directory where executed
 * @param {number} runTimes Number of times to recursively check parent directory
 * @return {boolean} True or False
 *
 */

export function findFile(
    fileName: string,
    targetDirectory: string,
    runTimes = 1,
) {
    let runner = 0;
    let foundFile = false;

    const run = (parentDirectory: any) => {
        if (runner < runTimes) {
            if (
                fs.existsSync(
                    `${parentDirectory || targetDirectory}/${fileName}`,
                )
            ) {
                foundFile = true;

                return foundFile;
            }

            runner += 1;
            run(path.resolve(parentDirectory || targetDirectory, '..'));
        }

        return foundFile;
    };

    return run(targetDirectory);
}
