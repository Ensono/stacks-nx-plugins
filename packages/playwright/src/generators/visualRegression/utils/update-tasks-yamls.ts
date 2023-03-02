import { Tree } from '@nrwl/devkit';
import YAML from 'yaml';

export function updateTasksYaml(
    tree: Tree,
    { visualRegression }: { visualRegression: boolean },
) {
    if (!tree.exists('build/tasks.yaml')) {
        return;
    }

    const tasks = YAML.parse(tree.read('build/tasks.yaml', 'utf-8'));
    if (tasks.tasks) {
        // Add e2e tasks
        tasks.tasks = visualRegression
            ? {
                  ...tasks.tasks,
                  'e2e:local': {
                      description: 'Run e2e tests locally',
                      command: [
                          'npx nx affected --base="$BASE_SHA" --target=e2e-docker --parallel=1',
                      ],
                  },
                  'e2e:ci': {
                      description: 'Run e2e tests in ci',
                      command: [
                          'npx nx affected --base="$BASE_SHA" --target=e2e --parallel=1',
                      ],
                  },
                  'e2e:updatesnapshots': {
                      description: 'Run e2e snapshot updates in ci',
                      command: [
                          'npx nx affected --base="$BASE_SHA" --target=e2e --parallel=1 --skip-nx-cache --update-snapshots --grep @visual-regression',
                      ],
                  },
              }
            : {
                  ...tasks.tasks,
                  e2e: {
                      description: 'Run e2e tests',
                      command: [
                          'npx nx affected --base="$BASE_SHA" --target=e2e --parallel=1',
                      ],
                  },
              };
    }

    tree.write('build/tasks.yaml', YAML.stringify(tasks));
}

export function updateTaskctlYaml(
    tree: Tree,
    { visualRegression }: { visualRegression: boolean },
) {
    if (!tree.exists('taskctl.yaml')) {
        return;
    }

    const taskctl = YAML.parse(tree.read('taskctl.yaml', 'utf8'));
    if (taskctl.pipelines && visualRegression) {
        taskctl.pipelines.updatesnapshots = [{ task: 'e2e:updatesnapshots' }];
    }

    tree.write('taskctl.yaml', YAML.stringify(taskctl));
}
