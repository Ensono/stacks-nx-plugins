import {
    joinPathFragments,
    ProjectConfiguration,
    Tree,
    updateJson,
} from '@nrwl/devkit';

export function updateProjectJsonWithHtmlReport(
    projectRoot: string,
    project: ProjectConfiguration,
    tree: Tree,
) {
    updateJson(
        tree,
        joinPathFragments(project.root, 'project.json'),
        projectJson => {
            const updatedProjectJson = { ...projectJson };

            if (!projectJson.targets['html-report']) {
                updatedProjectJson.targets['html-report'] = {
                    executor: 'nx:run-commands',
                    options: {
                        commands: [
                            'mochawesome-merge reports-json-file/*.json>merged-html-report.json',
                            'marge merged-html-report.json --reportDir ./ --inline',
                        ],
                        parallel: false,
                        cwd: `${projectRoot}/test-results/downloads`,
                    },
                    configurations: {
                        ci: {
                            cwd: `${projectRoot}/../../test-results/next-app-e2e/downloads`,
                        },
                    },
                };
            }

            return updatedProjectJson;
        },
    );
}
