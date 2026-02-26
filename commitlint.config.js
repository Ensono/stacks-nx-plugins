async function getConfig() {
    return {
        extends: ['@commitlint/config-conventional'],
        rules: {
            'scope-empty': [2, 'always'],
            'scope-enum': [0, 'never'],
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
                        feat: {
                            emoji: false,
                        },
                        fix: {
                            emoji: false,
                        },
                        docs: {
                            emoji: false,
                        },
                        test: {
                            emoji: false,
                        },
                        chore: {
                            emoji: false,
                        },
                        ci: {
                            emoji: false,
                        },
                        deps: {
                            description: 'An update to project dependencies',
                            title: 'Dependencies',
                        },
                    },
                },
            },
        },
    };
}

module.exports = getConfig();
