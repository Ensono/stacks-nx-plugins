const {
    default: {
        utils: { getProjects },
    },
} = require('@commitlint/config-nx-scopes');

module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': async context => [
            2,
            'always',
            [
                ...(await getProjects(
                    context,
                    ({ name }) => !name.includes('-e2e'),
                )),
            ],
        ],
        'type-enum': [
            2,
            'always',
            ['feat', 'fix', 'deps', 'docs', 'test', 'chore', 'ci'],
        ],
    },
    prompt: {
        settings: {
            enableMultipleScopes: false,
        },
        questions: {
            type: {
                enum: {
                    deps: {
                        description: 'An update to project dependencies',
                        title: 'Dependencies',
                    },
                },
            },
        },
    },
};
