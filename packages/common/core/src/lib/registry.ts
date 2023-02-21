import { NxJsonConfiguration } from '@nrwl/devkit';

function lowerCaseCharactersOnly(value: string) {
    return value.replace(/([^A-Za-z])/g, '').toLowerCase();
}

export function getRegistryUrl(
    options: NxJsonConfiguration['stacks'],
    envType: string,
) {
    const {
        business: { company, domain },
        cloud: { region, platform },
    } = options;

    let registry = lowerCaseCharactersOnly(
        `${company}${domain}${envType}${region}core`,
    );

    if (platform === 'azure') {
        registry = `${registry}.azurecr.io`;
        return registry;
    }

    throw new Error(`${platform} is not a supported cloud platform yet.`);
}

export function getResourceGroup(
    options: NxJsonConfiguration['stacks'],
    envType: string,
) {
    const {
        business: { company, domain },
        cloud: { region, platform },
    } = options;

    const resourceGroup = lowerCaseCharactersOnly(
        `${company}-${domain}-${envType}-${region}-core`,
    );

    return resourceGroup;
}
