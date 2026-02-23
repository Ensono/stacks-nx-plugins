import { addDependenciesToPackageJson, Tree, NX_VERSION } from '@nx/devkit';

import {
    ADDON_A11Y_STORYBOOK_VERSION,
    ADDON_LINKS_STORYBOOK_VERSION,
    ESLINT_STORYBOOK_VERSION,
    NEXTJS_STORYBOOK_VERSION,
} from './constants';
import { StorybookGeneratorSchema } from '../schema';

export function installDependencies(
    tree: Tree,
    options: StorybookGeneratorSchema,
) {
    if (options.skipPackageJson) {
        return () => void 0;
    }

    return addDependenciesToPackageJson(
        tree,
        {},
        {
            '@nx/storybook': NX_VERSION,
            '@nx/webpack': NX_VERSION,
            '@storybook/nextjs': NEXTJS_STORYBOOK_VERSION,
            '@storybook/addon-links': ADDON_LINKS_STORYBOOK_VERSION,
            '@storybook/addon-a11y': ADDON_A11Y_STORYBOOK_VERSION,
            'eslint-plugin-storybook': ESLINT_STORYBOOK_VERSION,
        },
    );
}
