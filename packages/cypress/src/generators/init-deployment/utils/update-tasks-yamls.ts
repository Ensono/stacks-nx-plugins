import { Tree } from '@nrwl/devkit';
import YAML from 'yaml';

export function updateTasksYaml(tree: Tree) {
    if (!tree.exists('build/taskctl/tasks.yaml')) {
        return;
    }

    const tasks = YAML.parse(tree.read('build/taskctl/tasks.yaml', 'utf-8'));
    if (tasks.tasks) {
        // Add e2e tasks
        tasks.tasks = {
            ...tasks.tasks,
            'e2e:ci': {
                description: 'Run e2e tests in ci',
                command: [
                    'npx nx affected --base="$BASE_SHA" --target=e2e --parallel=1',
                ],
            },
            html: {
                description: 'Generate html reports for tests',
                command: [
                    'npx nx affected --base="$BASE_SHA" --target=html-report --configuration=ci --parallel=1',
                ],
            },
        };
    }

    tree.write('build/taskctl/tasks.yaml', YAML.stringify(tasks));
}

export function updateTaskctlYaml(tree: Tree) {
    if (!tree.exists('taskctl.yaml')) {
        return;
    }

    const taskctl = YAML.parse(tree.read('taskctl.yaml', 'utf8'));
    taskctl.pipelines.dev = [
        { task: 'lint' },
        { task: 'build', depends_on: 'lint' },
        { task: 'e2e:ci', depends_on: 'build' },
        { task: 'html', depends_on: 'e2e:ci' },
        { task: 'version', depends_on: 'e2e:ci' },
        { task: 'terraform', depends_on: 'version' },
        { task: 'helm', depends_on: 'terraform' },
    ];
    taskctl.pipelines.fe = [
        { task: 'lint' },
        { task: 'build', depends_on: 'lint' },
        { task: 'e2e:ci', depends_on: 'build' },
        { task: 'html', depends_on: 'e2e:ci' },
        { task: 'version', depends_on: 'e2e:ci' },
    ];
    taskctl.pipelines.nonprod = [
        { task: 'lint:ci' },
        { task: 'build:ci', depends_on: 'lint:ci' },
        { task: 'test:ci', depends_on: 'build:ci' },
        { task: 'e2e:ci', depends_on: 'test:ci' },
        { task: 'html', depends_on: 'e2e:ci' },
        { task: 'version:nonprod', depends_on: 'e2e:ci' },
        { task: 'terraform:nonprod', depends_on: 'version:nonprod' },
        { task: 'helm:nonprod', depends_on: 'terraform:nonprod' },
    ];
    taskctl.pipelines.prod = [
        { task: 'build:ci' },
        { task: 'test:ci', depends_on: 'build:ci' },
        { task: 'e2e:ci', depends_on: 'test:ci' },
        { task: 'html', depends_on: 'e2e:ci' },
        { task: 'version:prod', depends_on: 'e2e:ci' },
        { task: 'terraform:prod', depends_on: 'version:prod' },
        { task: 'helm:prod', depends_on: 'terraform:prod' },
    ];

    tree.write('taskctl.yaml', YAML.stringify(taskctl));
}
