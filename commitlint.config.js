const {
    utils: { getProjects },
} = require('@commitlint/config-nx-scopes');

module.exports = {
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
