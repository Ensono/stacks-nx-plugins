import { JestExecutorOptions } from '@nrwl/jest/src/executors/jest/schema';

export interface End2EndExecutorSchema {
    verdaccioConfig: string;
    jestOptions: JestExecutorOptions;
}
