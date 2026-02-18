import kill from 'kill-port';
import { check as portCheck } from 'tcp-port-used';

const KILL_PORT_DELAY = 2000;
const MAX_RETRIES = 3;

export async function killPort(port: number): Promise<boolean> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (!(await portCheck(port))) {
                console.log(`Port ${port} is already free`);

                return true;
            }

            console.log(
                `Port ${port} in use, killing (attempt ${attempt}/${MAX_RETRIES})...`,
            );
            await kill(port, 'tcp');
            await new Promise<void>(resolve =>
                setTimeout(() => resolve(), KILL_PORT_DELAY),
            );

            if (!(await portCheck(port))) {
                console.log(`Port ${port} freed successfully`);

                return true;
            }
        } catch (error) {
            console.error(
                `Port ${port} kill attempt ${attempt} failed:`,
                error instanceof Error ? error.message : error,
            );
        }
    }

    console.error(
        `Port ${port} could not be freed after ${MAX_RETRIES} attempts`,
    );

    return false;
}
