import kill from 'kill-port';
import { check as portCheck } from 'tcp-port-used';

const KILL_PORT_DELAY = 5000;

export async function killPort(port: number): Promise<boolean> {
    if (await portCheck(port)) {
        try {
            await kill(port);
            await new Promise<void>(resolve =>
                // eslint-disable-next-line no-promise-executor-return
                setTimeout(() => resolve(), KILL_PORT_DELAY),
            );
            if (await portCheck(port)) {
                console.error(`Port ${port} still open`);
            } else {
                return true;
            }
        } catch {
            console.error(`Port ${port} closing failed`);
        }
        return false;
    }
    return true;
}
