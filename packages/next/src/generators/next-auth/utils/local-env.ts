import { createOrUpdateLocalEnv } from '@ensono-stacks/core';
import {
    GeneratorCallback,
    ProjectConfiguration,
    Tree,
    logger,
} from '@nx/devkit';
import crypto from 'crypto';

import { NextAuthGeneratorSchema } from '../schema';

const commonEnv = {
    NEXTAUTH_URL_INTERNAL: 'http://localhost:3000',
    AUTH_TRUST_HOST: 'true',
    AUTH_SECRET: `${crypto.randomBytes(32).toString('hex')}`,
};

const providerEnv: Record<
    NextAuthGeneratorSchema['provider'],
    Record<string, string>
> = {
    'microsoft-entra-id': {
        AZURE_AD_CLIENT_ID: '',
        AZURE_AD_CLIENT_SECRET: '',
        AZURE_AD_TENANT_ID: '',
    },
    auth0: {
        AUTH0_CLIENT_ID: '',
        AUTH0_CLIENT_SECRET: '',
        AUTH0_ISSUER: '',
    },
    none: {},
};

export function addToLocalEnv(
    project: ProjectConfiguration,
    tree: Tree,
    options: NextAuthGeneratorSchema,
): GeneratorCallback {
    const sessionEnv =
        options.sessionStorage === 'redis'
            ? { AUTH_REDIS_URL: 'localhost:6379' }
            : null;

    createOrUpdateLocalEnv(project, tree, {
        ...commonEnv,
        ...providerEnv[options.provider],
        ...sessionEnv,
    });

    return () => {
        logger.warn(
            `Do not forget to update your .env.local environment variables with values.`,
        );
    };
}
