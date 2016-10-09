'use babel';

/**
 * Check if a name should be suggested
 *
 * @param  {string} name   - name of the function, varible, etc
 * @param  {string} prefix - completion prefix, should be lower case
 * @return {boolean}       - add suggestion?
 */
export const check = (name, prefix) => {
    if (!name || !prefix) {
        return false;
    }

    return name.startsWith(prefix) ||
           name.toLowerCase().startsWith(prefix);
};

export const abbreviate = fullName =>
    fullName.match(/^.|[A-Z]/g).join('').toLowerCase();


export const getCompletionPrefix = (editor, bufferPosition) => {
    const {expression, courserPos} = getExpressionInfo(editor, bufferPosition);

    const match = expression.substr(0, courserPos)
                            .match(/([a-zA-Z][a-zA-Z0-9_:]*)$/);

    if (!match) {
        return null;
    } else {
        const prefix = match[0];
        if (prefix) {
            return prefix.toLowerCase();
        }
    }
};

const getExpressionInfo = (editor, bufferPosition) => {
    const scope = '.el_expression';
    const tb = editor.tokenizedBuffer;
    const range = tb.bufferRangeForScopeAtPosition(scope, bufferPosition);
    const expression = editor.getTextInRange(range);
    const preCourser = editor.getTextInBufferRange({
            start: range.start,
            end: bufferPosition,
        });

    return {
        courserPos: preCourser.length,
        expression,
    };
};

export const shortType = longName =>
    longName.match(/([a-zA-Z][a-zA-Z0-9\[\]]*)\s*$/)[1];

export const mergeCompletions = (sources) => {
    return options => {
        let suggestions = [];

        sources.forEach(source =>
            suggestions.push(...source(options)));

        return suggestions;
    };
};
