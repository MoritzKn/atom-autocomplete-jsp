'use babel';

import {add as addToRegistry} from '../registry';
import {KeywordDesc} from '../dataClasses';

const keywords = [
    new KeywordDesc({
        keyword: 'div',
        description: 'Division.',
    }),
    new KeywordDesc({
        keyword: 'mod',
        description: 'Modulo (remainder)',
    }),
    new KeywordDesc({
        keyword: 'eq',
        description: 'Test for equality.',
    }),
    new KeywordDesc({
        keyword: 'ne',
        description: 'Test for inequality.',
    }),
    new KeywordDesc({
        keyword: 'lt',
        description: 'Test for less than.',
    }),
    new KeywordDesc({
        keyword: 'gt',
        description: 'Test for greater than.',
    }),
    new KeywordDesc({
        keyword: 'le',
        description: 'Test for less or equal.',
    }),
    new KeywordDesc({
        keyword: 'ge',
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
        description: 'Negation',
    }),
    new KeywordDesc({
        keyword: 'empty',
        description: 'Test for empty variable values.',
    }),
];

export function register() {
    keywords.forEach(el => {
        addToRegistry({
            element: el,
            liveTime: Infinity,
        });
    });
}
