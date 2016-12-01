'use babel';

import {oneTrue} from './utils';
import {getAll as getRegistryElements} from './registry';
import {TagFunctionDesc, VarDesc, KeywordDesc} from './dataClasses';
import match from 'match-like';

const Context = {
    PROPERTY: 1,
    NONE: 2,
};

const getCompletionPrefix = preCourser => {
    const match = preCourser.match(/([a-zA-Z][a-zA-Z0-9_:]*)$/);
    if (!match) {
        return null;
    } else {
        const prefix = match[0];
        if (prefix) {
            return prefix;
        }
    }
};

const getExpressionInfo = (editor, bufferPosition) => {
    const cutOfExpressionMarks = exp => exp
        .replace(/^\$\{/, '')
        .replace(/\}$/, '');

    const scope = '.el_expression';
    const tb = editor.tokenizedBuffer;
    const range = tb.bufferRangeForScopeAtPosition(scope, bufferPosition);
    const expression = cutOfExpressionMarks(editor.getTextInRange(range));
    const preCourser = cutOfExpressionMarks(editor.getTextInBufferRange({
            start: range.start,
            end: bufferPosition,
        }));

    return {
        courserPos: preCourser.length,
        preCourser,
        expression,
    };
};

export default {
    selector: '.text.html.jsp .el_expression',
    disableForSelector: '.el_expression .string',
    /*
     * More than autocomplete-java-minus, because in the language-java repo,
     * .el_expressions are still considered .source.java.
     * @see: https://github.com/atom/language-java/pull/65
     */
    inclusionPriority: 1001,
    excludeLowerPriority: true,

    getSuggestions: options => {
        const {preCourser} = getExpressionInfo(options.editor, options.bufferPosition);
        const prefix = getCompletionPrefix(preCourser);

        if (!prefix) {
            return [];
        }

        const ctx = [{
                    tester: pre => pre.match(/\.\s*([a-zA-Z][a-zA-Z0-9_:]*)?$/),
                    type: Context.PROPERTY,
                }, {
                    tester: () => true,
                    type: Context.NONE,
                }
            ]
            .filter(type => type.tester(preCourser))
            .map(type => type.type)[0];

        const prefixLower = prefix.toLowerCase();

        const validConstructors = match(ctx, [
            [Context.PROPERTY, () =>
                [/* PropertyDesc */]],
            [Context.NONE, () =>
                [TagFunctionDesc, VarDesc, KeywordDesc]],
            [() => []],
        ]);

        return getRegistryElements()
            .filter(elDesc => oneTrue(validConstructors,
                cons => elDesc instanceof cons))
            .filter(elDesc => elDesc.filter(prefixLower))
            .map(elDesc => elDesc.suggestion(prefix));
    },
};
