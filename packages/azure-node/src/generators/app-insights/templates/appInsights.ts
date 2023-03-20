export const initAppInsights = (
    applicationinsightsConnectionString: string,
) => `appInsights
    .setup(process.env.${applicationinsightsConnectionString})
    .setAutoCollectConsole(true, true)
    .setAutoCollectDependencies(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectHeartbeat(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectRequests(true)
    .setAutoDependencyCorrelation(true)
    .setSendLiveMetrics(true)
    .setUseDiskRetryCaching(true);`;

export const configureAppInsights = (
    projectName: string,
) => `appInsights.defaultClient.context.tags[
    appInsights.defaultClient.context.keys.cloudRole
] = '${projectName}';`;

export const startAppInsights = () => `appInsights.start();`;
