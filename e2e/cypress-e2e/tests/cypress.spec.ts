import { newProject, cleanup } from "@ensono-stacks/e2e";
import {
  checkFilesExist,
  readJson,
  runNxCommand,
  runNxCommandAsync,
  uniq,
} from "@nrwl/nx-plugin/testing";

import {
  CYPRESS_VERSION,
  CYPRESSMULTIREPORTERS_VERSION,
  MOCHAWESOME_VERSION,
  MOCHAWESOMEJUNITREPORTER_VERSION,
  MOCHAWESOMEMERGE_VERSION,
  NRWLCYPRESS_VERSION,
} from "../../../packages/cypress/src/versions";

let baseProject, applicationDirectory, cypressDirectory;
describe("cypress e2e", () => {
  function setupBaseProject() {
    baseProject = uniq("cypress");
    applicationDirectory = `apps/${baseProject}`;
    cypressDirectory = `${applicationDirectory}/cypress`;
    runNxCommand(
      `generate @nrwl/next:application ${baseProject} --e2eTestRunner=none`
    );
    return { baseProject, applicationDirectory, cypressDirectory };
  }

  beforeAll(async () => {
    await newProject(["@nrwl/cypress", "@nrwl/next"]);
  }, 200_000);

  afterAll(() => {
    runNxCommandAsync("reset");
    cleanup();
  });

  describe("--project", () => {
    it("errors when the project does not exist", async () => {
      const project = uniq("imaginaryProjectThatDoesNotExist");
      await runNxCommandAsync(
        `generate @ensono-stacks/cypress:init ${project}`
      ).catch((stderr) => expect(stderr?.code).toEqual(1));
    }, 200_000);

    describe("should successfully run and amend config files if project does exist", () => {
      
      beforeAll(async () => {
        setupBaseProject();
        await runNxCommandAsync(
          `generate @ensono-stacks/cypress:init --project=${baseProject} --no-interactive`
        );
      });

      it("should add/update the relevent files", () => {
        expect(() =>
          checkFilesExist(
            "cypress.config.base.ts",
            `${applicationDirectory}/cypress.config.ts`,
            `${applicationDirectory}/project.json`,
            `${cypressDirectory}/e2e/example.cy.ts`,
            `${cypressDirectory}/support/e2e.ts`,
            `${applicationDirectory}/tsconfig.json`,
            `${applicationDirectory}/tsconfig.cy.json`,
            `${applicationDirectory}/cypress.config.ts`
          )
        ).not.toThrow();
      });

      it("should delete the relevent files", () => {
        expect(checkFilesExist(`${cypressDirectory}/support/e2e.ts`)).toThrow();
        expect(
          checkFilesExist(`${cypressDirectory}/support/app.po.ts`)
        ).toThrow();
        expect(checkFilesExist(`${cypressDirectory}/e2e/app.cy.ts`)).toThrow();
      });

      it("should update the package.json", () => {
        const packageJson = readJson(`${applicationDirectory}/project.json`);
        expect(packageJson?.devDependencies).toMatchObject({
          cypress: CYPRESS_VERSION,
          "@nrwl/cypress": NRWLCYPRESS_VERSION,
          "cypress-multi-reporters": CYPRESSMULTIREPORTERS_VERSION,
          mochawesome: MOCHAWESOME_VERSION,
          "mochawesome-merge": MOCHAWESOMEMERGE_VERSION,
          "mocha-junit-reporter": MOCHAWESOMEJUNITREPORTER_VERSION,
        });
      }, 200_000);
    });
  });
});