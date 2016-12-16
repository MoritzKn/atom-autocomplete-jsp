'use babel';

import {add as addToRegistry} from '../registry';
import {KeywordDesc} from '../desc-classes';

const keywords = [
    new KeywordDesc({
        keyword: 'div',
        fullName: 'Division',
        description: 'Divides left-hand operand by right-hand operand.',
    }),
    new KeywordDesc({
        keyword: 'mod',
        fullName: 'Modulus (Remainder)',
        description: 'Divides left-hand and right-hand operand and returns remainder.',
    }),
    new KeywordDesc({
        keyword: 'eq',
        fullName: 'equal',
        description: 'Test for equality.',
    }),
    new KeywordDesc({
        keyword: 'ne',
        fullName: 'not equal',
        description: 'Test for inequality.',
    }),
    new KeywordDesc({
        keyword: 'lt',
        fullName: 'less than',
        description: 'Test for less than.',
    }),
    new KeywordDesc({
        keyword: 'gt',
        fullName: 'greater than',
        description: 'Test for greater than.',
    }),
    new KeywordDesc({
        keyword: 'le',
        fullName: 'less or equal',
        description: 'Test for less or equal.',
    }),
    new KeywordDesc({
        keyword: 'ge',
        fullName: 'greater or equal',
        description: 'Test for greater or equal.',
    }),
    new KeywordDesc({
        keyword: 'and',
        description: 'Test for logical and.',
    }),
    new KeywordDesc({
        keyword: 'or',
        description: 'Test for logical or.',
    }),
    new KeywordDesc({
        keyword: 'not',
        description: 'Logically negates right-hand operand.',
    }),
    new KeywordDesc({
        keyword: 'empty',
        description: 'Test for empty variable values.',
    }),
];

export function register() {
    keywords.forEach(element => addToRegistry({element}));
}
