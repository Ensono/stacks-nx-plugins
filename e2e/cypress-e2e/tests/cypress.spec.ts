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
  AXECORE_VERSION,
  CYPRESSAXE_VERSION,
} from "../../../packages/cypress/src/versions";

let baseProject, applicationDirectory, cypressDirectory;
describe("cypress e2e", () => {
  function setupBaseProject() {
    baseProject = uniq("cypress");
    applicationDirectory = `apps/${baseProject}`;
    cypressDirectory = `${applicationDirectory}/cypress`;
    runNxCommand(
      `generate @nrwl/next:application ${baseProject} --e2eTestRunner=none --verbose`
    );
    return { baseProject, applicationDirectory, cypressDirectory };
  }

  beforeAll(async () => {
    await newProject(["@ensono-stacks/cypress"], ["@nrwl/cypress", "@nrwl/next"]);
  }, 200_000);

  afterAll(() => {
    runNxCommandAsync("reset");
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
          `generate @ensono-stacks/cypress:init --project=${baseProject} --no-interactive --verbose`
        );
      }, 2_000_000);

      it("should add/update the relevent files", () => {
        expect(() =>
          checkFilesExist(
            "cypress.config.base.ts",
            `${applicationDirectory}/cypress.config.ts`,
            `${applicationDirectory}/project.json`,
            `${cypressDirectory}/e2e/example.cy.ts`,
            `${cypressDirectory}/support/e2e.ts`,
            `${applicationDirectory}/tsconfig.json`,
            `${applicationDirectory}/cypress.config.ts`
          )
        ).not.toThrow();
      });

      it("should delete the relevent files", () => {
        expect( () => {
          checkFilesExist(`${cypressDirectory}/support/app.po.ts`)
        }).toThrow();
        expect(() => { checkFilesExist(`${cypressDirectory}/e2e/app.cy.ts`) }).toThrow();
        expect(() => { checkFilesExist(`${applicationDirectory}/tsconfig.cy.json`) }).toThrow();
      });

      it("should update the package.json", () => {
        const packageJson = readJson('package.json');
        expect(packageJson?.devDependencies).toMatchObject({
          cypress: CYPRESS_VERSION,
          "cypress-multi-reporters": CYPRESSMULTIREPORTERS_VERSION,
          mochawesome: MOCHAWESOME_VERSION,
          "mochawesome-merge": MOCHAWESOMEMERGE_VERSION,
          "mocha-junit-reporter": MOCHAWESOMEJUNITREPORTER_VERSION,
          "@nrwl/cypress": "^15.9.4"
        });
      }, 200_000);

      it("should successfully add accessibility test files and add dependencies", async () => {
        runNxCommand(
          `generate @ensono-stacks/cypress:accessibility --project=${baseProject} --no-interactive`
        );

        expect(() =>
          checkFilesExist(`${cypressDirectory}/e2e/axe-accessibility.cy.ts`)
        ).not.toThrow();

        // add axe packages to package.json
        const packageJson = readJson("package.json");
        expect(packageJson?.devDependencies).toMatchObject({
          "axe-core": AXECORE_VERSION,
          "cypress-axe": CYPRESSAXE_VERSION,
        });
      }, 200_000);
      
    });
  });
});
