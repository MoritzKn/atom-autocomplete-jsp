'use babel';

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


export const attrRegExp = (() => {
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
 * @param   {string}   text
 * @param   {string[]} attributesNames
 * @returns {Object} an object which that maps the attribute names to there values
 */
export function extractAttributes(text) {
    const attributes = {};
    const attrMatch = text.match(/[a-zA-Z0-9_\-]+="[^"]*"/g);
    if (attrMatch) {
        attrMatch.forEach(attrStr => {
            const [, name, value] = attrStr.match(/([a-zA-Z0-9_\-]+)="([^"]*)"/);
            attributes[name] = value;
        });
    }
    return attributes;
}
