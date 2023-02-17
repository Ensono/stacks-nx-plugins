import chalk from 'chalk';

export function thirdPartyDependancyWarning(dependencies: string[]) {
    let dependancyList = '';
    dependencies.forEach(dependancy => {
        // eslint-disable-next-line unicorn/prefer-spread
        dependancyList = dependancyList.concat(dependancy, '\n');
    });
    console.warn(
        chalk.yellow`This generator depends on third party generators listed below:\n${dependancyList}`,
    );
}
