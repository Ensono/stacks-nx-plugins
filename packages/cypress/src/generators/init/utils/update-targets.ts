import {
    joinPathFragments,
    ProjectConfiguration,
    Tree,
    updateJson,
} from '@nx/devkit';

export function updateProjectJsonWithHtmlReport(
    projectRoot: string,
    project: ProjectConfiguration,
    tree: Tree,
) {
    updateJson(
        tree,
        joinPathFragments(`${project.sourceRoot}-e2e`, 'project.json'),
        projectJson => {
            const updatedProjectJson = { ...projectJson };

            if (!projectJson.targets['html-report']) {
                updatedProjectJson.targets['html-report'] = {
                    executor: 'nx:run-commands',
                    options: {
                        commands: [
                            'mochawesome-merge reports-json-file/app.json -o merged-html-report.json',
                            'marge merged-html-report.json ./ --inline',
                        ],
                        parallel: false,
                        cwd: `${projectRoot}/test-results/downloads`,
                    },
                    configurations: {
                        ci: {
                            cwd: `test-results/${project.name}-e2e/downloads`,
                        },
                    },
                };
            }

            return updatedProjectJson;
        },
    );
}
