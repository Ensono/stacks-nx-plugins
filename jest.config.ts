import { getJestProjectsAsync } from '@nx/jest';

export default async () => ({
    projects: await getJestProjectsAsync(),
    testTimeout: 120_000,
});
