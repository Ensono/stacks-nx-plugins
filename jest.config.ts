import { getJestProjects } from '@nx/jest';

export default {
    projects: getJestProjects(),
    testTimeout: 60_000,
};
