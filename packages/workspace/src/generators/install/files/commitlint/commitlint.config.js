const {
    utils: { getProjects },
} = require('@commitlint/config-nx-scopes');

module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': async context => [
            2,
            'always',
            [
                'root',
                ...(await getProjects(
                    context,
                    ({ name }) => !name.includes('e2e'),
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
