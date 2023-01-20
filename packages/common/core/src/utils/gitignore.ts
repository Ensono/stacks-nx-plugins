import ignore from 'ignore';
import { Tree } from 'nx/src/generators/tree';

export function addGitIgnoreEntry(
    tree: Tree,
    comment: string,
    entries: string[],
) {
    if (!tree.exists('.gitignore')) {
        return;
    }

    let content = tree.read('.gitignore', 'utf-8')?.trimEnd() || '';

    const ig = ignore();
    ig.add(content);

    // add comment section to the bottom of gitignore if it doesn't exist
    if (!content.includes(`# ${comment}`)) {
        content = `${content}\n\n# ${comment}`;
    }

    // split the gitignore to subsets based on empty lines
    const subsets = content.split('\n\n');

    entries.forEach(entry => {
        if (!ig.ignores(`apps/example/${entry}`)) {
            const subsetIndex = subsets.findIndex(subset =>
                subset.includes(`# ${comment}`),
            );
            subsets[subsetIndex] = `${subsets[subsetIndex]}\n${entry}`;
        }
    });

    // write the changes back to content
    content = subsets.join('\n\n');

    // write the content to the file tree
    tree.write('.gitignore', content);
}
