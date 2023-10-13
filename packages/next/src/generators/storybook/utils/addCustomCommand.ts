import { joinPathFragments, Tree, updateJson } from '@nx/devkit';
import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

export const addCustomCommand = (tree: Tree, project: ProjectConfiguration) => {
    updateJson(
        tree,
        joinPathFragments(project.root, 'project.json'),
        projectJson => {
            const updateProjectJson = { ...projectJson };

            if (!projectJson.targets['custom-component']) {
                updateProjectJson.targets['custom-component'] = {
                    executor: 'nx:run-commands',
                    options: {
                        commands: [
                            `nx g @nx/react:component --project='${project.name}'`,
                            'nx g @nx/react:component-story',
                        ],
                        parallel: false,
                    },
                };
            }

            return updateProjectJson;
        },
    );

    return () => {};
};
