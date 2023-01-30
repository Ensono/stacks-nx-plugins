import { joinPathFragments, Tree, updateJson } from '@nrwl/devkit';

function getTestConfig(projectSourceRoot: string) {
    return {
        executor: '@nrwl/jest:jest',
        outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
        options: {
            jestConfig: `${projectSourceRoot}/jest.config.ts`,
            passWithNoTests: true,
            collectCoverage: true,
            coverageReporters: ['text', 'html'],
            collectCoverageFrom: [
                './**/*.{js,jsx,ts,tsx}',
                './!**/.next/**',
                './!**/*.d.ts',
                './!**/*.config.*',
                './!**/_app.*',
            ],
            codeCoverage: true,
        },
        configurations: {
            ci: {
                ci: true,
            },
        },
    };
}

export default async function addCustomTestConfig(
    tree: Tree,
    projectSourceRoot: string,
) {
    updateJson(
        tree,
        joinPathFragments(projectSourceRoot, 'project.json'),
        json => {
            const updatedJson = json;
            updatedJson.targets = updatedJson.targets ?? {};
            updatedJson.targets.test = getTestConfig(projectSourceRoot);
            return updatedJson;
        },
    );
}
