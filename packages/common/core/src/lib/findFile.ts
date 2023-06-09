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
    runTimes: number,
) {
    let runner = 0;
    let foundFile = false;

    const run = (childDirectory: any) => {
        if (runner < runTimes) {
            const directoryFiles = fs.readdirSync(
                childDirectory || targetDirectory,
            );

            if (directoryFiles.includes(fileName)) {
                foundFile = true;
                return foundFile;
            }

            runner += 1;
            run(path.resolve(childDirectory || targetDirectory, '..'));
        }
        return foundFile;
    };

    return run(targetDirectory);
}
