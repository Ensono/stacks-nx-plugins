import { nxE2EPreset } from '@nrwl/cypress/plugins/cypress-preset';

const appName = process.env.NX_TASK_TARGET_PROJECT as string;
const outputFolderForProject = process.env.CI
  ? `../../test-results/${appName}`
  : 'cypress/test-results';
const baseURL = process.env.BASE_URL || 'http://localhost:4200/';
export const baseConfig: Cypress.ConfigOptions = {
  reporter: '../../node_modules/cypress-multi-reporters',
  reporterOptions: {
    reporterEnabled: !process.env.CI
      ? 'spec'
      : 'spec, mocha-junit-reporter, mochawesome',
    mochaJunitReporterReporterOptions: {
      mochaFile: outputFolderForProject.concat(
        '/downloads/junit-report/results-[hash].xml'
      ),
    },
    mochawesomeReporterOptions: {
      charts: true,
      overwrite: false,
      html: false,
      json: true,
      reportDir: outputFolderForProject.concat('/downloads/reports-json-file'),
      reportFilename: '[name].html',
      embeddedScreenshots: true,
      inlineAssets: true,
    },
  },
  e2e: {
    ...nxE2EPreset(__dirname, { cypressDir: 'cypress' }),
    baseUrl: baseURL,
    screenshotsFolder: outputFolderForProject.concat('/screenshots'),
    videosFolder: outputFolderForProject.concat('/videos'),
    downloadsFolder: outputFolderForProject.concat('/downloads'),
    videoUploadOnPasses: false,
    trashAssetsBeforeRuns: true,
    retries: {
      runMode: process.env.CI ? 2 : 0,
    },
  },
};
