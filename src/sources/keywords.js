'use babel';

import {mkSimpleSuggestionFilter, getCompletionPrefix} from '../utils';

const keywords = [
    'div', 'mod', 'eq', 'ne', 'lt', 'gt', 'le',
    'ge', 'and', 'or', 'not', 'empty',
];

export const getElKeywords = ({editor, bufferPosition}) => {
    const prefix = getCompletionPrefix(editor, bufferPosition);

    if (!prefix) {
        return [];
    }

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
