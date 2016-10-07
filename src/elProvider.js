'use babel';

import {mergeCompletions} from './utils';

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

    getSuggestions: mergeCompletions([
        getImplicitElObjects,
        getElKeywords,
        getElFunctions,
    ]),
};
