async function getConfig() {
    const {
        default: {
            utils: { getProjects },
        },
    } = await import('@commitlint/config-nx-scopes');

    return {
        extends: ['@commitlint/config-conventional'],
        rules: {
            'scope-enum': async context => [
                2,
                'always',
                [
                    'root',
                    ...(await getProjects(
                        context,
                        ({ name }) => !name.includes('-e2e'),
                    )),
                ],
            ],
        },
        prompt: {
            settings: {
                enableMultipleScopes: false,
            },
        },
    };
}

module.exports = getConfig();
