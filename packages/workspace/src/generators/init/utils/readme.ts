import { Tree } from '@nx/devkit';
import { updateReadme } from '@nx/workspace/src/generators/move/lib/update-readme';
import { NormalizedSchema } from '@nx/workspace/src/generators/move/schema';
import path from 'path';

export function modifyReadme(tree: Tree) {
    const schema: NormalizedSchema = {
        importPath: '',
        projectName: 'Ensono Stacks',
        destination: '',
        relativeToRootDestination: '',
        updateImportPath: false,
    };

    const readmePath = path.join(
        __dirname,
        schema.relativeToRootDestination,
        'README.md',
    );

    if (!tree.exists(readmePath)) {
        return;
    }

    updateReadme(tree, schema);

    const oldReadmeFileContent = tree.read(readmePath, 'utf8');

    const oldBuildHeading =
        /To execute tasks with Nx use the following syntax/g;
    const newBuildHeading =
        'all commands below expect nx to be globally installed. Add `npx` before the command if you do not have nx globally installed. \n To run the app use the following command:';

    const oldNxTarget = /nx <target> <project> <...options>/g;
    const newBuildCommand = 'nx build <project> <...options>';

    const oldNxMultiTask = /You can also run multiple targets/g;
    const newServeText = 'To run the app locally use the following command:';

    const oldRunManyCommand = /nx run-many -t <target1> <target2>/g;
    const newServeCommand = 'nx serve <project> <...options>';

    const oldOptionsText = /..or add `-p` to filter specific projects/g;
    const newTestText = 'To test the app use the following command:';

    const oldManyOptionsCommand =
        /nx run-many -t <target1> <target2> -p <proj1> <proj2>/g;
    const newTestCommand = 'nx test <project> <...options>';

    const newFileWithName = oldReadmeFileContent
        ? oldReadmeFileContent.replaceAll(oldBuildHeading, newBuildHeading)
        : '';

    const newFileBuildCommand = newFileWithName.replaceAll(
        oldNxTarget,
        newBuildCommand,
    );

    const newServeTextReplace = newFileBuildCommand.replaceAll(
        oldNxMultiTask,
        newServeText,
    );

    const newServeCommandReplace = newServeTextReplace.replaceAll(
        oldRunManyCommand,
        newServeCommand,
    );

    const newTestTextReplace = newServeCommandReplace.replaceAll(
        oldOptionsText,
        newTestText,
    );

    const newTestCommandReplace = newTestTextReplace.replaceAll(
        oldManyOptionsCommand,
        newTestCommand,
    );

    tree.write(readmePath, newTestCommandReplace);
}
