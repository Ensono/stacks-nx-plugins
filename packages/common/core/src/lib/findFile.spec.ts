import fs from 'fs';

import { findFile } from '.';

describe('findFile', () => {
    it('should return false if file not found', () => {
        expect(findFile('test.json', './', 3)).toBe(false);
    });

    describe('recursive', () => {
        beforeEach(() => {
            fs.mkdirSync('./test/child/child2', { recursive: true });
            fs.writeFileSync('./test.json', 'test');
        });

        afterEach(() => {
            fs.unlinkSync('./test.json');
            fs.rmSync('./test', { recursive: true });
        });

        it('should return true if file found', () => {
            expect(findFile('test.json', './', 3)).toBe(true);
        });

        it('should return true if file found 2nd level', () => {
            expect(findFile('test.json', './test', 3)).toBe(true);
        });

        it('should return true if file found 3rd level', () => {
            expect(findFile('test.json', './test/child', 3)).toBe(true);
        });
    });
});
