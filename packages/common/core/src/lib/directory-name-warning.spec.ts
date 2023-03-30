import { warnDirectoryProjectName } from '.';

describe('custom directory', () => {
    beforeEach(() => {
        console.log = jest.fn();
    });

    afterEach(jest.restoreAllMocks);

    describe('warnDirectoryProjectName', () => {
        it('should print the warning message if the directory option is provided', () => {
            warnDirectoryProjectName({
                directory: 'testDir',
                name: 'project',
                projectName: 'project',
                projectRoot: '',
                projectDirectory: '',
                parsedTags: [],
            });

            expect(console.log).toHaveBeenCalledTimes(2);
        });
    });
});
