export const initAppInsights = (appInsightsKey: string) => `appInsights
    .setup(process.env.${appInsightsKey})
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
