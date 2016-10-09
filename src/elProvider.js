'use babel';

import {getCompletionPrefix} from './utils';
import {getAll as getRegistryElements} from './registry';
import {TagFunctionDesc, VarDesc, KeywordDesc} from './dataClasses';

export default {
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

        return getRegistryElements()
            .filter(elDesc =>
                    elDesc instanceof TagFunctionDesc ||
                    elDesc instanceof VarDesc ||
                    elDesc instanceof KeywordDesc)
            .filter(elDesc => elDesc.filter(prefix))
            .map(elDesc => elDesc.suggestion(prefix));
    },
};
