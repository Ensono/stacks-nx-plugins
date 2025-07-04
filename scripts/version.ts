#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { execSync } from 'child_process';

import { releaseVersion, releaseChangelog } from 'nx/release';
import {
    gitCommit,
    gitTag,
    gitPush,
    getLatestGitTagForPattern,
} from 'nx/src/command-line/release/utils/git';

(async () => {
    const options = parseArgs();

    const versionResults = await releaseVersion({
        specifier: options.specifier,
        preid: options.specifier === 'prerelease' ? 'alpha' : undefined,
        stageChanges: true,
        gitCommit: false,
        gitTag: false,
        gitPush: false,
        verbose: true,
        dryRun: options.dryRun,
    });

    let fromTag = (await getLatestGitTagForPattern('v{version}'))?.tag;

    if (options.specifier === 'prerelease') {
        const currentNpmVersion = execSync(
            'npm view @ensono-stacks/core@latest version',
            {
                windowsHide: false,
            },
        )
            .toString()
            .trim();

        fromTag = `v${currentNpmVersion}`;
    }

    console.log(`> Creating changelog of updates from ${fromTag}`);

    await releaseChangelog({
        version: versionResults.workspaceVersion,
        versionData: versionResults.projectsVersionData,
        from: fromTag,
        gitCommit: false,
        gitTag: false,
        gitPush: false,
        gitRemote: 'origin',
        deleteVersionPlans: true,
        dryRun: options.dryRun,
        verbose: true,
    });

    await gitCommit({
        messages: [
            `chore(release): publish ${versionResults.workspaceVersion} [no ci]`,
        ],
        dryRun: options.dryRun,
        verbose: true,
    });

    await gitTag({
        tag: `v${versionResults.workspaceVersion}`,
        dryRun: options.dryRun,
        verbose: true,
    });

    await gitPush({
        gitRemote: 'origin',
        dryRun: options.dryRun,
        verbose: true,
    });

    process.exit(0);
})();

function parseArgs() {
    const parsedArgs = yargs(hideBin(process.argv))
        .scriptName('pnpm release')
        .strictOptions()
        .version(false)
        .command('$0', 'Version packages for publishing')
        .options('specifier', {
            type: 'string',
            default: 'patch',
            choices: ['major', 'minor', 'patch', 'prerelease'],
            description: `Version specifier to use for the packages e.g. 'major', 'minor', 'patch', 'prerelease'`,
        })
        .option('dryRun', {
            type: 'boolean',
            default: false,
            description: 'Run the command without making any changes',
        })
        .parseSync();

    return parsedArgs;
}
