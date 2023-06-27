import { NxJsonStacksConfiguration } from '@nx/devkit';

function lowerCaseCharactersOnly(value: string) {
    return value.replaceAll(/([^A-Za-z])/g, '').toLowerCase();
}

function hyphenatedLowerCaseCharactersOnly(value: string) {
    return value.replaceAll(/([^A-Za-z-])/g, '').toLowerCase();
}

export function getRegistryUrl(
    options: NxJsonStacksConfiguration['config'],
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
    options: NxJsonStacksConfiguration['config'],
    envType: string,
) {
    const {
        business: { company, domain },
        cloud: { region },
    } = options;

    const resourceGroup = hyphenatedLowerCaseCharactersOnly(
        `${company}-${domain}-${envType}-${region}-core`,
    );

    return resourceGroup;
}
