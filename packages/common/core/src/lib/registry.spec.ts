import { getRegistryUrl, getResourceGroup } from '.';

describe('registry', () => {
    const partialStacksConfig = {
        business: {
            company: 'Amido',
            domain: 'stacks',
            component: 'nx',
        },
        cloud: {
            region: 'euw',
            platform: 'azure',
        },
    };

    describe('getRegistryUrl', () => {
        it('should return with the registry url based on stacks config', () => {
            const result = getRegistryUrl(partialStacksConfig as any, 'test');
            expect(result).toEqual('amidostackstesteuwcore.azurecr.io');
        });

        it('should throw an error if platform is not supported', () => {
            expect(() =>
                getRegistryUrl(
                    {
                        ...partialStacksConfig,
                        cloud: {
                            region: 'euw',
                            platform: 'cloudplatform',
                        },
                    } as any,
                    'test',
                ),
            ).toThrow('cloudplatform is not a supported cloud platform yet.');
        });
    });

    describe('getResourceGroup', () => {
        it('should return the resource group name', () => {
            const result = getResourceGroup(partialStacksConfig as any, 'test');
            expect(result).toEqual('amido-stacks-test-euw-core');
        });
    });
});
