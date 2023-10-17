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
                            `nx g @nx/react:component --name={args.name} --project=${project.name} --directory={args.folderPath}`,
                            `nx g @nx/react:component-story --project=${project.name} --componentPath={args.folderPath}/{args.name}/{args.name}.tsx`,
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
