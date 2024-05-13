import { createOrUpdateLocalEnv } from '@ensono-stacks/core';
import { ProjectConfiguration, Tree } from '@nx/devkit';
import crypto from 'crypto';

import { NextAuthGeneratorSchema } from '../schema';

const commonEnv = {
    AUTH_URL: 'http://localhost:4200',
    AUTH_SECRET: `${crypto.randomBytes(32).toString('hex')}`,
};

const providerEnv: Record<
    NextAuthGeneratorSchema['provider'],
    Record<string, string>
> = {
    azureAd: {
        AZURE_AD_CLIENT_ID: '',
        AZURE_AD_CLIENT_SECRET: '',
        AZURE_AD_TENANT_ID: '',
    },
    none: {},
};

export function addToLocalEnv(
    project: ProjectConfiguration,
    tree: Tree,
    provider: NextAuthGeneratorSchema['provider'],
) {
    createOrUpdateLocalEnv(project, tree, {
        ...commonEnv,
        ...providerEnv[provider],
    });
}
