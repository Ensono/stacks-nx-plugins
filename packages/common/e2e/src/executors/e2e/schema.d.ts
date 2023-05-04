import { JestExecutorOptions } from '@nx/jest/src/executors/jest/schema';

export interface End2EndExecutorSchema {
    verdaccioConfig: string;
    jestOptions: JestExecutorOptions;
}
