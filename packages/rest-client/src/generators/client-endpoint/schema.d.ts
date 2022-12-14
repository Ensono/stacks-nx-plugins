export interface ClientEndpointGeneratorSchema {
    name: string;
    httpClient: string;
    envVar: string;
    endpointVersion: number;
    methods: string[];
    directory: string;
    tags?: string;
}
