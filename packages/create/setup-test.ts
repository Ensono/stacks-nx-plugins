import { vi } from 'vitest';
import yargsFactory from 'yargs/yargs';

// Mock yargs to fix ESM interop issues with Vite SSR transform
// The issue is that Vite's SSR transform doesn't correctly handle yargs's ESM exports
vi.mock('yargs', () => {
    const yargsInstance = yargsFactory();

    // Add static methods that the code expects
    yargsInstance.terminalWidth = () => 80;

    return { default: yargsInstance };
});

vi.mock('./src/bin/package-manager', async importOriginal => {
    const actual =
        await importOriginal<typeof import('./src/bin/package-manager')>();

    return {
        ...actual,
        detectPackageManager: vi.fn(() => 'npm'),
    };
});

vi.mock('@ensono-stacks/core', async importOriginal => {
    const actual = await importOriginal<typeof import('@ensono-stacks/core')>();

    return {
        ...actual,
        execAsync: vi.fn(),
        getCommandVersion: vi.fn(() => '1.0.0'),
    };
});
