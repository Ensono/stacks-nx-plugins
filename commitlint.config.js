async function getConfig() {
    const {
        default: {
            utils: { getProjects },
        },
    } = await import('@commitlint/config-nx-scopes');

    return {
        extends: ['@commitlint/config-conventional'],
        rules: {
            'scope-enum': async ctx => [
                2,
                'always',
                [
                    'root',
                    ...(await getProjects(
                        ctx,
                        ({ projectType }) => projectType === 'library',
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
