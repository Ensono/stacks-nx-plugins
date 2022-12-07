/* eslint-disable unicorn/better-regex */
import { Tree } from '@nrwl/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';

export function readJsonInJS<T>(tree: Tree, path: string, selector: string): T {
    const source = tree.read(path)?.toString();
    if (!source) {
        throw new Error(`Unable to read source ${path}`);
    }
    const ast = tsquery.ast(source);
    const [result] = tsquery.query(ast, selector);
    try {
        return JSON.parse(
            source
                .slice(result.pos, result.end)
                .replace(/'/g, '"')
                .replace(/\s"{0}(\w+?)"{0}(?=:)/g, '"$1"')
                .replace(/(,)\s*(?=}|]){1}/g, ''),
        );
    } catch {
        throw new Error(
            `Unable to parse Json from ${path} with selector ${selector}`,
        );
    }
}
