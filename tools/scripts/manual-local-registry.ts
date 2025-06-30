import startLocalRegistry from './start-local-registry';
import stopLocalRegistry from './stop-local-registry';

async function main() {
    await startLocalRegistry();
    console.log('Local registry started successfully.');

    process.on('SIGINT', () => {
        stopLocalRegistry();
        console.log('Local registry stopped.');
        process.exit(0);
    });
}

main().catch(error => {
    console.error('Error starting local registry:', error);
    process.exit(1);
});
