export interface ClientEndpointGeneratorSchema {
    name: string;
    httpClient: string;
    methods: string[];
    envVar: string;
    endpointVersion: number;
    folderPath: string;
    importPath?: string;
    tags?: string;
}
