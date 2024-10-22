import type { Config } from '@jest/types';
import { config as dotEnvConfig } from 'dotenv';

dotEnvConfig();

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['.d.ts', '.js'],
    verbose: false,
};
export default config;
