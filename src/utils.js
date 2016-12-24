'use babel';

/**
 * Test whether a given function returns true for any of the supplied values
 *
 * @param   {Array}   values
 * @param   {Funtion} testFn
 * @returns {boolean}
 */
export function oneTrue(values, testFn) {
    for (let i = 0; i < values.length; i += 1) {
        if (testFn(values[i])) {
            return true;
        }
    }
    return false;
}

/**
 * Tries to get a property from nested objects, but stops if
 * any property on the path isn't an object.
 *
 * You can use this for example if you want to get `foo.bar.baz`
 * but are not sure if foo.bar` allways exists.
 * In that case you could use `getDeepPropSave(foo, 'bar', 'baz')`.
 *
 * @param   {*}        obj
 * @param   {String[]} path
 * @returns *
 */
export function getDeepPropSave(obj, ...path) {
    let lastEL = obj;
    path.forEach(key => {
        if (typeof lastEL !== 'object') {
            return undefined;
        }
        lastEL = lastEL[key];
    });
    return lastEL;
}


export const attrRegExp = (function() {
    let cache = {};

    return function attrRegExp(name) {
        if (cache[name]) {
            return cache[name];
        } else {
            const regExp = new RegExp(`${name}="([^"]*)"`);
            cache[name] = regExp;
            return regExp;
        }
    };
}());

/**
 * Finds all attributes in a XML tag like text
 *
 * @param   {string} text
 * @param   {string} attributesNames
 * @returns {Object} an object with that maps the attribute names to there values
 */
export function extractAttributes(text, attributesNames) {
    const attributes = {};

    attributesNames.forEach(name => {
        const res = text.match(attrRegExp(name));
        if (res && res[1]) {
            attributes[name] = res[1];
        } else {
            attributes[name] = undefined;
        }
    });

    return attributes;
}
