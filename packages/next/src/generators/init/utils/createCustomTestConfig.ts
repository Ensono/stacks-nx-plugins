import { joinPathFragments, Tree, updateJson } from '@nrwl/devkit';

const testConfig = {
    executor: '@nrwl/jest:jest',
    outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
    options: {
        jestConfig: 'apps/next-project/jest.config.ts',
        passWithNoTests: true,
        collectCoverage: true,
        coverageReporters: ['text', 'html'],
        collectCoverageFrom: [
            './**/*.{js,jsx,ts,tsx}',
            './!**/.next/**',
            './!**/*.d.ts',
            './!**/*.config.*',
        ],
        codeCoverage: true,
        ci: true,
    },
    configurations: {
        ci: {},
    },
};

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
            updatedJson.targets.test = testConfig;
            return updatedJson;
        },
    );
}
