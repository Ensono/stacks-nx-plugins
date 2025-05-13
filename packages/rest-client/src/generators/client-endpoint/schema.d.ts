export interface ClientEndpointGeneratorSchema {
    name: string;
    httpClient: string;
    methods: string[];
    envVar: string;
    endpointVersion: number;
    directory: string;
    importPath?: string;
    tags?: string;
}
