'use babel';

/**
 * Check if something should be suggested
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


export const shortType = longName =>
    longName.match(/([a-zA-Z_][a-zA-Z_0-9\[\]]*)\s*$/)[1];

export const mergeCompletions = (sources) => {
    return options => {
        let suggestions = [];

        sources.forEach(source =>
            suggestions.push(...source(options)));

        return suggestions;
    };
};

/**
 * Test whether a function returns true for any of the supplied values
 *
 * @param  {Array}   values
 * @param  {Funtion} testFn
 * @return {boolean}
 */
export const oneTrue = (values, testFn) => {
    for (let i = 0; i < values.length; i++) {
        if (testFn(values[i])) {
            return true;
        }
    }
    return false;
};
