'use babel';

import match from 'match-like';

import {getUsedTaglibs} from './get-used-taglibs';
import {getAll as getRegistryElements} from './registry';
import {TagFunctionDesc, VarDesc, KeywordDesc} from './desc-classes';

/**
 * Context of the completion
 * @enum {number}
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
 * @param   {string} preCursor part of the expression before the cursor
 * @returns {Context}
 */
function getcompletionContext(preCursor) {
    return contextTests.filter(type => type.tester(preCursor))
                       .map(type => type.type)[0];
}

/**
 * Gets the valid desc classes for a given completion context
 * @param   {Context} context the completion context
 * @returns {Function}          constructor of a desc class
 */
function getTypesForContext(context) {
    return match(context, [
        [Context.PROPERTY, () => [/* TODO: PropertyDesc */]],
        [Context.NONE,     () => [TagFunctionDesc, VarDesc, KeywordDesc]],
        [                  () => []],
    ]);
}

function getCompletionPrefix(preCursor) {
    const result = preCursor.match(/([a-zA-Z][a-zA-Z0-9_:]*)$/);
    if (!result) {
        return null;
    }
    return result[0] || null;
}

/**
 * Cuts off the `${` at the start and `}` at the end of an EL expression
 * @param   {string} exp
 * @returns {string}
 */
function cutOffExpressionMarks(exp) {
    return exp.replace(/^\$\{/, '')
              .replace(/\}$/, '');
}

function getExpressionInfo(editor, bufferPosition) {
    const scope = '.el_expression';
    const tb = editor.tokenizedBuffer;
    const range = tb.bufferRangeForScopeAtPosition(scope, bufferPosition);
    if (!range) {
        throw Error(`The bufferPosition (${bufferPosition}) has no expression scope`);
    }
    const expression = cutOffExpressionMarks(editor.getTextInRange(range));
    const preCursorRange = {
        start: range.start,
        end: bufferPosition,
    };
    const preCursor = cutOffExpressionMarks(editor.getTextInBufferRange(preCursorRange));

    return {
        cursorPos: preCursor.length,
        preCursor,
        expression,
    };
}

export default {
    selector: '.text.html.jsp .el_expression.jsp',
    disableForSelector: '.el_expression.jsp .string, .el_expression.jsp > .begin',
    /*
     * More than autocomplete-java-minus, because in the language-java repo,
     * .el_expressions are still considered .source.java.
     * @see: https://github.com/atom/language-java/pull/65
     */
    inclusionPriority: 1001,
    excludeLowerPriority: true,

    getSuggestions: ({editor, bufferPosition, activatedManually}) => {
        const {preCursor} = getExpressionInfo(editor, bufferPosition);
        const replacementPrefix = getCompletionPrefix(preCursor);

        if (!replacementPrefix) {
            return [];
        }

        if (!activatedManually) {
            const minLen = atom.config.get('autocomplete-plus.minimumWordLength');
            if (replacementPrefix.length < minLen) {
                return [];
            }
        }

        const preText = editor.buffer.getTextInRange([[0, 0], bufferPosition]);
        const usedTaglibs = getUsedTaglibs(preText);

        const context = getcompletionContext(preCursor);
        const prefix = replacementPrefix.toLowerCase();
        const validTypes = getTypesForContext(context);

        return getRegistryElements()
            .filter(desc => validTypes.some(cons => desc instanceof cons))
            .filter(desc => desc.filter({prefix, usedTaglibs}))
            .map(desc => desc.suggestion({replacementPrefix, usedTaglibs}));
    },
};
