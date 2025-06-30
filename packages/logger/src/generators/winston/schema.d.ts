export interface WinstonLoggerGeneratorSchema {
    name: string;
    tags?: string;
    directory: string;
    skipFormat?: boolean;
    logLevelType?: 'cli' | 'syslog' | 'npm';
    consoleLogs?: boolean;
    fileTransportPath?: string;
    httpTransportHost?: string;
    httpTransportPort?: number;
    httpTransportPath?: string;
    httpTransportSSL?: boolean;
    streamPath?: string;
}
