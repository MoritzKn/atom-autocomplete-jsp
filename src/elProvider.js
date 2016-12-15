'use babel';

import match from 'match-like';

import {oneTrue} from './utils';
import {getAll as getRegistryElements} from './registry';
import {TagFunctionDesc, VarDesc, KeywordDesc} from './descClasses';

/**
 * Context of the completion
 * @enum {Number}
 */
const Context = {
    PROPERTY: 1,
    NONE: 2,
};

/**
 * Correlation between `Context` types and test functions
 * @type {Array}
 */
const contextTests = [{
    tester: pre => pre.match(/\.\s*([a-zA-Z][a-zA-Z0-9_:]*)?$/),
    type: Context.PROPERTY,
}, {
    tester: () => true,
    type: Context.NONE,
}];

/**
 * detects the context of the completion
 * @param  {String} preCourser
 * @returns Context
 */
function getcompletionContext(preCourser) {
    return contextTests.filter(type => type.tester(preCourser))
                       .map(type => type.type)[0];
}

/**
 * Gets the valid desc classes for a given completion context
 * @param   {Context} context the completion context
 * @returns Function          constructor of a desc class
 */
function getTypesForContext(context) {
    return match(context, [
        [Context.PROPERTY, () => [/* TODO: PropertyDesc */]],
        [Context.NONE,     () => [TagFunctionDesc, VarDesc, KeywordDesc]],
        [                  () => []],
    ]);
}

function getCompletionPrefix(preCourser) {
    const result = preCourser.match(/([a-zA-Z][a-zA-Z0-9_:]*)$/);
    if (!result) {
        return null;
    }
    return result[0] || null;
}

function cutOffExpressionMarks(exp) {
    return exp.replace(/^\$\{/, '')
              .replace(/\}$/, '');
}

function getExpressionInfo(editor, bufferPosition) {
    const scope = '.el_expression';
    const tb = editor.tokenizedBuffer;
    const range = tb.bufferRangeForScopeAtPosition(scope, bufferPosition);
    const expression = cutOffExpressionMarks(editor.getTextInRange(range));
    const preCourserRange = {
        start: range.start,
        end: bufferPosition,
    };
    const preCourser = cutOffExpressionMarks(editor.getTextInBufferRange(preCourserRange));

    return {
        courserPos: preCourser.length,
        preCourser,
        expression,
    };
}

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

    getSuggestions: ({editor, bufferPosition, activatedManually}) => {
        const {preCourser} = getExpressionInfo(editor, bufferPosition);
        const prefix = getCompletionPrefix(preCourser);

        if (!prefix) {
            return [];
        }

        if (!activatedManually) {
            const minLen = atom.config.get('autocomplete-plus.minimumWordLength');
            if (prefix.length <= minLen) {
                return [];
            }
        }

        const context = getcompletionContext(preCourser);
        const prefixLower = prefix.toLowerCase();
        const validTypes = getTypesForContext(context);

        return getRegistryElements()
            .filter(elDesc => oneTrue(validTypes, cons => elDesc instanceof cons))
            .filter(elDesc => elDesc.filter(prefixLower))
            .map(elDesc => elDesc.suggestion(prefix));
    },
};
