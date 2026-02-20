import kill from 'kill-port';
import { check as portCheck, waitUntilFree } from 'tcp-port-used';

const WAIT_TIMEOUT_MS = 15000; // Max time to wait for port to be free
const RETRY_INTERVAL_MS = 500;

export async function killPort(port: number): Promise<boolean> {
    try {
        if (!(await portCheck(port))) {
            console.log(`Port ${port} is already free`);

            return true;
        }

        console.log(`Port ${port} in use, attempting to kill...`);

        try {
            await kill(port, 'tcp');
            console.log(`kill-port executed for port ${port}`);
        } catch (error) {
            // "No process running on port" means the process is dead but port is in TIME_WAIT
            const message =
                error instanceof Error ? error.message : String(error);
            if (!message.includes('No process running on port')) {
                console.warn(`kill-port failed: ${message}`);
            } else {
                console.log(
                    `Port ${port} has no process (likely TIME_WAIT state)`,
                );
            }
        }

        // Wait for the port to become free (handles TIME_WAIT)
        console.log(
            `Waiting up to ${WAIT_TIMEOUT_MS / 1000}s for port ${port} to be released...`,
        );
        await waitUntilFree(port, RETRY_INTERVAL_MS, WAIT_TIMEOUT_MS);
        console.log(`Port ${port} is now free`);

        return true;
    } catch (error) {
        console.error(
            `Port ${port} could not be freed:`,
            error instanceof Error ? error.message : error,
        );

        return false;
    }
}
