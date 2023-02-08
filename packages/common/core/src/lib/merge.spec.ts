import deepMerge from 'deepmerge';

import combineMerge from './merge';

describe('merge', () => {
    describe('combineMerge', () => {
        it('merges a complex object', () => {
            const result = deepMerge(
                {
                    something: {
                        property: 'property',
                        nestedObject: {
                            property: 'property',
                            something: 2,
                            onlyInSource: 'value',
                        },
                    },
                },
                {
                    something: {
                        property: 'property',
                        nestedObject: {
                            property: {
                                anotherNestedObject: {
                                    something: 'value',
                                },
                            },
                            something: 5,
                        },
                    },
                },
                { arrayMerge: combineMerge },
            );

            expect(result).toStrictEqual({
                something: {
                    property: 'property',
                    nestedObject: {
                        property: {
                            anotherNestedObject: {
                                something: 'value',
                            },
                        },
                        something: 5,
                        onlyInSource: 'value',
                    },
                },
            });
        });

        it('merges an array', () => {
            const result = deepMerge(
                ['value', 1, 'anotherValue', 232],
                ['valuesOnlyInTarget', 232],
                { arrayMerge: combineMerge },
            );

            expect(result).toMatchObject([
                'value',
                1,
                'anotherValue',
                232,
                'valuesOnlyInTarget',
            ]);
        });

        it('merges a complex object including nested arrays', () => {
            const result = deepMerge(
                {
                    something: {
                        property: 'property',
                        nestedArray: [
                            1,
                            232,
                            { nestedArray: [1, 3, 5, 'something'] },
                        ],
                    },
                },
                {
                    something: {
                        property: 'property',
                        nestedArray: [
                            'valuesOnlyInTarget',
                            232,
                            { nestedArray: ['nestedArrayValueInTarget'] },
                        ],
                    },
                },
                { arrayMerge: combineMerge },
            );

            expect(result).toMatchObject({
                something: {
                    property: 'property',
                    nestedArray: [
                        1,
                        232,
                        {
                            nestedArray: [
                                1,
                                3,
                                5,
                                'something',
                                'nestedArrayValueInTarget',
                            ],
                        },
                        'valuesOnlyInTarget',
                    ],
                },
            });
        });

        it('merges to an empty object', () => {
            const result = deepMerge(
                {},
                {
                    something: {
                        property: 'property',
                        nestedObject: {
                            property: {
                                anotherNestedObject: {
                                    something: 'value',
                                },
                            },
                            something: 5,
                        },
                    },
                },
                { arrayMerge: combineMerge },
            );

            expect(result).toStrictEqual({
                something: {
                    property: 'property',
                    nestedObject: {
                        property: {
                            anotherNestedObject: {
                                something: 'value',
                            },
                        },
                        something: 5,
                    },
                },
            });
        });

        it('merges with a custom unique key', () => {
            const result = deepMerge(
                {
                    value: [
                        {
                            uniqueKey: 'value1',
                            property: {
                                something: true,
                                anotherProperty: 'value',
                            },
                        },
                        { uniqueKey: 'value2', property: { something: true } },
                    ],
                },
                {
                    value: [
                        { uniqueKey: 'value1', property: { something: false } },
                        { uniqueKey: 'value3', property: { something: true } },
                    ],
                },
                {
                    arrayMerge: (target, source, options) =>
                        combineMerge(target, source, options, 'uniqueKey'),
                },
            );

            expect(result).toStrictEqual({
                value: [
                    {
                        uniqueKey: 'value1',
                        property: {
                            something: false,
                            anotherProperty: 'value',
                        },
                    },
                    { uniqueKey: 'value2', property: { something: true } },
                    { uniqueKey: 'value3', property: { something: true } },
                ],
            });
        });

        it('merges with a custom unique key with an unordered array', () => {
            const result = deepMerge(
                {
                    value: [
                        {
                            uniqueKey: ['value1', 'value2', 'value3'],
                            property: {
                                something: true,
                                anotherProperty: true,
                            },
                        },
                        {
                            uniqueKey: ['value4', 'value5', 'value6'],
                            property: { something: true },
                        },
                    ],
                },
                {
                    value: [
                        {
                            uniqueKey: ['value3', 'value1', 'value2'],
                            property: { something: false },
                        },
                        {
                            uniqueKey: ['value7', 'value8', 'value9'],
                            property: { something: true },
                        },
                    ],
                },
                {
                    arrayMerge: (target, source, options) =>
                        combineMerge(target, source, options, 'uniqueKey'),
                },
            );

            expect(result).toStrictEqual({
                value: [
                    {
                        uniqueKey: ['value1', 'value2', 'value3'],
                        property: { something: false, anotherProperty: true },
                    },
                    {
                        uniqueKey: ['value4', 'value5', 'value6'],
                        property: { something: true },
                    },
                    {
                        uniqueKey: ['value7', 'value8', 'value9'],
                        property: { something: true },
                    },
                ],
            });
        });

    });
});
