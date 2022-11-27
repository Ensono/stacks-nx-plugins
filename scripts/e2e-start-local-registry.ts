import { exec } from 'child_process';

const verdaccio = exec(
  'npx verdaccio --config ./scripts/local-registry/config.yml'
);
verdaccio.unref();

console.log('starting local registry');

function outputHandling(data: any) {
  console.log(data.toString());
  if (data.toString().indexOf('address already in use') > -1) {
    console.log('Ignoring the error. The local registry is already running.');
    process.exit(0);
  }
}

verdaccio.stdout?.on('data', outputHandling);
verdaccio.stderr?.on('data', outputHandling);
verdaccio.on('exit', (code) => process.exit(code ?? 0));

setTimeout(() => process.exit(0), 2000);
