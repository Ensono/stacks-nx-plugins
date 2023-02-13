import { joinPathFragments, ProjectConfiguration, Tree } from '@nrwl/devkit';
import crypto from 'crypto';

import { NextAuthGeneratorSchema } from '../schema';
import { DEFAULT_REDIS_URL } from './constants';

const commonEnv = [
    `NEXTAUTH_URL=http://localhost:4200`,
    `NEXTAUTH_SECRET=${crypto.randomBytes(32).toString('hex')}`,
];

const providerEnv: Record<NextAuthGeneratorSchema['provider'], string[]> = {
    azureAd: [
        'AZURE_AD_CLIENT_ID=',
        'AZURE_AD_CLIENT_SECRET=',
        'AZURE_AD_TENANT_ID=',
    ],
    azureAdB2C: [
        'AZURE_AD_CLIENT_ID=',
        'AZURE_AD_CLIENT_SECRET=',
        'AZURE_AD_TENANT_ID=',
    ],
    none: [],
};

export function createOrUpdateLocalEnv(
    project: ProjectConfiguration,
    tree: Tree,
    {
        provider,
        redisEnvVar,
    }: {
        provider: NextAuthGeneratorSchema['provider'];
        redisEnvVar?: NextAuthGeneratorSchema['redisEnvVar'];
    },
) {
    const localEnvPath = joinPathFragments(project.root, '.env.local');
    const envValues = [...commonEnv, ...providerEnv[provider]];

    if (redisEnvVar) {
        envValues.push(`${redisEnvVar}=${DEFAULT_REDIS_URL}`);
    }

    if (!tree.exists(localEnvPath)) {
        tree.write(localEnvPath, envValues.map(env => `${env}\n`).join(''));
    } else {
        let localEnv = tree.read(localEnvPath).toString().trim();
        envValues.forEach(env => {
            if (!localEnv.includes(`${env.split('=')[0]}=`)) {
                localEnv += `\n${env}`;
            }
        });
        tree.write(localEnvPath, localEnv);
    }
}
