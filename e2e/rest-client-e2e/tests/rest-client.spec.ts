import {
  checkFilesExist,
  runNxCommand,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';
import { newProject, cleanup } from '@ensono-stacks/e2e';

describe('rest-client e2e', () => {
  beforeAll(async () => {
      await newProject(['@ensono-stacks/rest-client'], ['@nrwl/js']);
  });

  afterAll(() => {
      cleanup();
  });

  describe('http-client', () => {
    const project = uniq('rest-client');
  
    beforeAll(async () => {
        await runNxCommandAsync(
            `generate @ensono-stacks/rest-client:http-client ${project}`,
        );
    })
  
    it('should create src in the specified directory', async () => {
        expect(() =>
            checkFilesExist(
                `libs/${project}/src/index.ts`,
                `libs/${project}/src/index.test.ts`,
            ),
        ).not.toThrow();
    }, 120000);
  
    it('should run the generated tests without failure', async () => {
        const result = await runNxCommandAsync(
            `test ${project}`,
        );
  
        expect(result.stderr).not.toEqual(expect.stringContaining('FAIL'));
    });
  });

  describe('client-endpoint', () => {
    const endpoint = uniq('testEndpoint');

    beforeAll(async () => {});

    it('should create src in the specified directory', () => {
        runNxCommand(
            `generate @ensono-stacks/rest-client:client-endpoint ${endpoint} --methods=get,post --directory=endpoints --no-interactive`,
        );

        expect(() =>
            checkFilesExist(
                `endpoints/${endpoint}/V1/index.ts`,
                `endpoints/${endpoint}/V1/index.test.ts`,
                `endpoints/${endpoint}/V1/index.types.ts`,
                `.env`,
            ),
        ).not.toThrow();
    }, 120000);
});

  describe('bump-version', () => {
      const endpoint = uniq('testEndpoint');

      beforeAll(() => {
          runNxCommand(
              `generate @ensono-stacks/rest-client:client-endpoint ${endpoint} --methods=get,post --directory=endpoints --endpointVersion=${Number(1)} --no-interactive`,
          );
          runNxCommand(
              `generate @ensono-stacks/rest-client:bump-version --endpointPath=endpoints --endpoint=${endpoint} --endpointVersion=${Number(2)} --no-interactive`,
          );
      });

      it('should copy the existing endpoint and bump the version', async () => {
          expect(() =>
              checkFilesExist(
                  `endpoints/${endpoint}/V1/index.ts`,
                  `endpoints/${endpoint}/V1/index.test.ts`,
                  `endpoints/${endpoint}/V1/index.types.ts`,
              ),
          ).not.toThrow();

          expect(() =>
          checkFilesExist(
              `endpoints/${endpoint}/V2/index.ts`,
              `endpoints/${endpoint}/V2/index.test.ts`,
              `endpoints/${endpoint}/V2/index.types.ts`,
          ),
      ).not.toThrow();
      }, 120000);
  });
});
