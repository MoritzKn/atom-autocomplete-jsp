'use babel';

import {mkSimpleSuggestionFilter} from '../utils';

const keywords = [
    'div', 'mod', 'eq', 'ne', 'lt', 'gt', 'le',
    'ge', 'and', 'or', 'not', 'empty',
];

export const getElKeywords = ({editor, prefix}) => {
    const filter = mkSimpleSuggestionFilter(prefix);
    const type = 'keyword';

    return keywords
        .filter(filter)
        .map(keyword => ({
            replacementPrefix: prefix,
            text: keyword,
            type: type,
        }));
};
