'use babel';

import {mergeCompletions} from './utils';

export const loadData = () => {

};

export default {
    loadData: () => {

    },

    selector: '.text.html.jsp',
    disableForSelector: '.source.java, .el_expression, .comment',
    inclusionPriority: 50,
    excludeLowerPriority: false, // include html tags etc

    getSuggestions: ({editor, bufferPosition}) => {
        return [];
    }
};
