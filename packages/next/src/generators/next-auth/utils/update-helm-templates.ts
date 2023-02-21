import { joinPathFragments, ProjectConfiguration, Tree } from '@nrwl/devkit';
import YAML from 'yaml';

export function updateDeploymentYaml(
    project: ProjectConfiguration,
    tree: Tree,
) {
    const update = `
          env:
            - name: REDIS_URL
              value: {{ .Values.redisURL }}
            - name: NEXTAUTH_SECRET
              value: {{ .Values.nextAuthSecret }}
            - name: NEXTAUTH_URL
              value: {{ .Values.nextAuthURL }}`;
    const filePath = joinPathFragments(
        project.root,
        'build/helm/templates/deplyoment.yaml',
    );
    const deployment = tree.read(filePath, 'utf-8');

    // Skip if it's already there
    if (deployment.search(update) !== -1) {
        return;
    }

    const searchTerm = '{{ .Chart.Name }}';
    const resultPosition = deployment.search(searchTerm);
    const updatedDeployment = `${deployment.slice(
        0,
        resultPosition + searchTerm.length,
    )}${update}${deployment.slice(resultPosition + searchTerm.length)}`;

    tree.write(filePath, updatedDeployment);
}

export function updateValuesYaml(
    project: ProjectConfiguration,
    tree: Tree,
    stacksConfig,
) {
    // Update values yaml
    const valuesFilePath = joinPathFragments(
        project.root,
        '/build/helm/values.yaml',
    );
    const valuesYAML: YAML.Document = YAML.parseDocument(
        tree.read(valuesFilePath, 'utf-8'),
    );

    if (!valuesYAML.has('redisURL')) {
        valuesYAML.add(valuesYAML.createPair('redisURL', ''));
    }

    if (!valuesYAML.has('nextAuthSecret')) {
        valuesYAML.add(valuesYAML.createPair('nextAuthSecret', ''));
    }

    if (!valuesYAML.has('nextAuthURL')) {
        valuesYAML.add(
            valuesYAML.createPair(
                'nextAuthURL',
                `${project.name}.${stacksConfig.domain.internal}`,
            ),
        );
    }

    tree.write(valuesFilePath, YAML.stringify(valuesYAML));

    // Update values-prod yaml
    const valuesProdFilePath = joinPathFragments(
        project.root,
        '/build/helm/values-prod.yaml',
    );
    const valuesProdYAML = YAML.parseDocument(
        tree.read(valuesProdFilePath, 'utf-8'),
    );

    if (!valuesProdYAML.has('redisURL')) {
        valuesProdYAML.add(valuesProdYAML.createPair('redisURL', ''));
    }

    if (!valuesProdYAML.has('nextAuthSecret')) {
        valuesProdYAML.add(valuesProdYAML.createPair('nextAuthSecret', ''));
    }

    if (!valuesProdYAML.has('nextAuthURL')) {
        valuesProdYAML.add(
            valuesProdYAML.createPair(
                'nextAuthURL',
                `${project.name}.${stacksConfig.domain.external}`,
            ),
        );
    }

    tree.write(valuesProdFilePath, YAML.stringify(valuesProdYAML));
}
