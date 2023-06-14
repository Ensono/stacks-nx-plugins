import fs from 'fs';
import path from 'path';
import { Arguments } from 'yargs';

import { CreateStacksArguments } from './types';

export function configureNx(
    options: Arguments<CreateStacksArguments>,
    cwd: string,
) {
    const nxJsonPath = path.join(cwd, 'nx.json');

    if (fs.existsSync(nxJsonPath)) {
        const data = fs.readFileSync(nxJsonPath, { encoding: 'utf8' });
        const nxJson = JSON.parse(data);

        nxJson.stacks = {
            config: {
                business: options.business,
                domain: options.domain,
                cloud: options.cloud,
                pipeline: options.pipeline,
                terraform: options.terraform,
                vcs: options.vcs,
            },
            executedGenerators: {
                project: {},
                workspace: [],
            },
        };

        fs.writeFileSync(nxJsonPath, JSON.stringify(nxJson, null, 2), {
            encoding: 'utf8',
        });
    }
}
