export interface AppInsightsWebGeneratorSchema {
    name: string;
    applicationinsightsConnectionString: string;
    directory: string;
    importPath?: string;
    tags?: string;
}
