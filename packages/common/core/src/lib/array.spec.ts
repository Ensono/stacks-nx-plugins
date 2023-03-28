import { ensureArray } from '.';

describe('array', () => {
    describe('ensureArray', () => {
        it('should retain the array if the input is an array', () => {
            expect(ensureArray([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
        });

        it('should return an array if the input is not an array', () => {
            expect(ensureArray(1)).toEqual([1]);
        });
    });
});
