'use babel';

import {mergeCompletions, getCompletionPrefix} from './utils';

import {getImplicitElObjects} from './sources/implicitObject';
import {getElKeywords} from './sources/keywords';
import {getElFunctions} from './sources/tlds';

export default {
    loadData: () => {

    },

    selector: '.text.html.jsp .el_expression',
    disableForSelector: '.el_expression .string',
    /*
     * More than autocomplete-java-minus, because in the language-java repo,
     * .el_expressions are still considered .source.java.
     * @see: https://github.com/atom/language-java/pull/65
     */
    inclusionPriority: 1001,
    excludeLowerPriority: true, // maybe..?

    getSuggestions: options => {
        const prefix = getCompletionPrefix(options.editor, options.bufferPosition);

        if (!prefix) {
            return [];
        }

        options.prefix = prefix;

        const suggestions = mergeCompletions([
            getImplicitElObjects,
            getElKeywords,
            getElFunctions,
        ])(options);

        suggestions.forEach(suggestion => {
            suggestion.replacementPrefix = prefix;
        });

        return suggestions;
    },
};
