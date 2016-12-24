'use babel';

import match from 'match-like';

import {oneTrue, extractAttributes} from './utils';
import {getAll as getRegistryElements} from './registry';
import {TagFunctionDesc, VarDesc, KeywordDesc, TaglibDesc} from './desc-classes';

const useTaglibRegExp = new RegExp(
    '<%@\\s+taglib\\s+' +
    '((?:prefix|uri)="[^"]*")\\s+' +
    '((?:prefix|uri)="[^"]*")\\s*',
    'g'
);

const useTaglibXmlRegExp = new RegExp(
    '<jsp:directive.taglib\\s+' +
    '((?:prefix|uri)="[^"]*")\\s+' +
    '((?:prefix|uri)="[^"]*")\\s*',
    'g'
);

const useTaglibNsRegExp = new RegExp(
    'xmlns:([^=]+)="([^"]+)"',
    'g'
);

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
 * Get the loaded tlds
 * @param   {string} text relevant editor content
 * @returns {Array}
 */
function getUsedTaglibs(text) {
    const uris = {};

    [useTaglibRegExp, useTaglibXmlRegExp].forEach(regExp => {
        text.replace(regExp, matchText => {
            const attributes = extractAttributes(matchText, ['prefix', 'uri']);
            uris[attributes.uri] = attributes.prefix;
        });
    });

    text.replace(useTaglibNsRegExp, (matchText, ns, uri) => {
        uris[uri] = ns;
    });

    return getRegistryElements({
        type: TaglibDesc,
        filter: [{
            name: 'uri',
            values: Object.keys(uris),
        }],
    }, false).map(desc => ({
        prefix: uris[desc.uri],
        desc,
    }));
}

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
            .filter(desc => oneTrue(validTypes, cons => desc instanceof cons))
            .filter(desc => desc.filter({prefix, usedTaglibs}))
            .map(desc => desc.suggestion({replacementPrefix, usedTaglibs}));
    },
};
