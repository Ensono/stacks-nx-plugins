// @ts-check

const execSync = require('child_process').execSync;

/**
 *
 * Partial from https://github.com/actions/toolkit/blob/c6b487124a61d7dc6c7bd6ea0208368af3513a6e/packages/github/src/context.ts
 * @typedef {{
 *   actor: string;
 *   runId: number;
 *   repo: { owner: string; repo: string };
 * }} GitHubContext
 *
 * @param {{
 *  github: import('octokit').Octokit;
 *  context: GitHubContext;
 *  core: import('@actions/core');
 * }} param
 */
module.exports = async ({ github, context, core }) => {
    const currentNxVersion =
        require('../package.json').devDependencies.nx.toString();
    const nxVersion = execSync('npm show nx version', {
        encoding: 'utf8',
    }).trim();
    const shouldMigrate = currentNxVersion !== nxVersion;

    console.log(`Current Nx version: ${currentNxVersion}`);
    console.log(`Latest Nx version: ${nxVersion}`);
    console.log(`Should migrate: ${shouldMigrate}`);

    core.setOutput('nx_version', nxVersion);
    core.setOutput('current_nx_version', currentNxVersion);
    core.setOutput('should_migrate', shouldMigrate.toString());
};
