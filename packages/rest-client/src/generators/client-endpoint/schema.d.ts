export interface ClientEndpointGeneratorSchema {
    name: string;
    httpClient: string;
    methods: string[];
    envVar: string;
    endpointVersion: number;
    directory?: string;
    projectNameAndRootFormat: 'as-provided' | 'derived';
    importPath?: string;
    tags?: string;
}
