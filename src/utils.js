'use babel';

/**
 * Test whether a given function returns true for any of the supplied values
 *
 * @param  {Array}   values
 * @param  {Funtion} testFn
 * @return {boolean}
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
