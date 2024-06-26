export interface HttpClientGeneratorSchema {
    name: string;
    directory?: string;
    projectNameAndRootFormat: 'as-provided' | 'derived';
    importPath?: string;
    tags?: string;
    skipFormat?: boolean;
}
