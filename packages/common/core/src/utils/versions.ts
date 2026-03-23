import semver from 'semver';

const nxVersion = semver.parse(__versions__.nx) || semver.parse('22.5.0');

export const NX_VERSION_SCOPE = `${nxVersion?.major}.${nxVersion?.minor}.x`;
