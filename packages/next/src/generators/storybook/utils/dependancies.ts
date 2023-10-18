import { addDependenciesToPackageJson, Tree } from '@nx/devkit';

import {
    ADDON_A11Y_STORYBOOK_VERSION,
    ADDON_ACTIONS_STORYBOOK_VERSION,
    ADDON_ESSENTIALS_STORYBOOK_VERSION,
    ADDON_JEST_STORYBOOK_VERSION,
    ADDON_LINKS_STORYBOOK_VERSION,
    CORE_SERVER_STORYBOOK_VERSION,
    ESLINT_STORYBOOK_VERSION,
    MANAGER_API_STORYBOOK_VERSION,
    NEXTJS_STORYBOOK_VERSION,
    NX_STORYBOOK_VERSION,
    NX_WEBPACK_VERSION,
    PREVIEW_API_STORYBOOK_VERSION,
    THEMING_STORYBOOK_VERSION,
} from './constants';
import { StorybookGeneratorSchema } from '../schema';

export function installDependencies(
    tree: Tree,
    options: StorybookGeneratorSchema,
) {
    if (options.skipPackageJson) {
        return () => null;
    }

    return addDependenciesToPackageJson(
        tree,
        {
            '@storybook/core-server': CORE_SERVER_STORYBOOK_VERSION,
        },
        {
            '@nx/storybook': NX_STORYBOOK_VERSION,
            '@nx/webpack': NX_WEBPACK_VERSION,
            '@storybook/nextjs': NEXTJS_STORYBOOK_VERSION,
            '@storybook/addon-essentials': ADDON_ESSENTIALS_STORYBOOK_VERSION,
            '@storybook/addon-actions': ADDON_ACTIONS_STORYBOOK_VERSION,
            '@storybook/addon-links': ADDON_LINKS_STORYBOOK_VERSION,
            '@storybook/manager-api': MANAGER_API_STORYBOOK_VERSION,
            '@storybook/preview-api': PREVIEW_API_STORYBOOK_VERSION,
            '@storybook/addon-a11y': ADDON_A11Y_STORYBOOK_VERSION,
            '@storybook/addon-jest': ADDON_JEST_STORYBOOK_VERSION,
            '@storybook/theming': THEMING_STORYBOOK_VERSION,
            'eslint-plugin-storybook': ESLINT_STORYBOOK_VERSION,
        },
    );
}
