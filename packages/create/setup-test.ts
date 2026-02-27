import { vi } from 'vitest';

// Mock yargs to fix ESM interop issues with Vite SSR transform
// The issue is that Vite's SSR transform doesn't correctly handle yargs's ESM exports
// Note: vi.importActual must be used inside the factory to get the real module (await import would
// return the mocked version, causing circular references).
// The source now calls yargs(hideBin(process.argv)) to get an Argv instance, so we expose a
// callable factory that injects a fixed terminalWidth on every created instance.
vi.mock('yargs', async () => {
    const { default: yargsFactory } =
        await vi.importActual<typeof import('yargs')>('yargs');

    const mockedFactory = (...args: Parameters<typeof yargsFactory>) => {
        const instance = (yargsFactory as CallableFunction)(...args);

        // Fix terminalWidth to a known value so tests don't query the real terminal size
        instance.terminalWidth = () => 80;

        return instance;
    };

    return { default: mockedFactory };
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
