export interface ClientEndpointGeneratorSchema {
    name: string;
    httpClient: string;
    envVar: string;
    endpointVersion: number;
    methods: string[];
    directory: string;
    projectNameAndRootFormat: 'as-provided' | 'derived';
    importPath?: string;
    tags?: string;
}
