export default {
    framework: {
        name: '@storybook/nextjs',
        options: {},
    },
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: [
        '@storybook/addon-essentials',
        '@storybook/addon-links',
        '@storybook/manager-api',
        '@storybook/preview-api',
        '@storybook/addon-a11y',
        '@storybook/addon-actions',
        '@storybook/addon-jest',
        '@storybook/theming',
        '@nx/react/plugins/storybook',
    ],
};
