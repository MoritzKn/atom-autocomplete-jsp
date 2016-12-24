'use babel';

function abbreviate(fullName) {
    const res = fullName.match(/^.|[A-Z]/g);

    if (!res || res.length === 0) {
        return '';
    } else {
        return res.join('').toLowerCase();
    }
}

function toShortType(longName) {
    return longName.match(/([a-zA-Z_][a-zA-Z_0-9\[\]]*)\s*$/)[1];
}

/**
 * Check if something should be suggested
 *
 * @param   {string} name   - name of the function, varible, etc
 * @param   {string} prefix - completion prefix, should be lower case
 * @returns {boolean}       - add suggestion?
 */
function check(name, prefix) {
    if (!name || !prefix) {
        return false;
    }

    return name.startsWith(prefix) ||
           name.toLowerCase().startsWith(prefix);
}

class GenericDesc {
    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name.trim();
        this.abbreviatedName = abbreviate(this.name);
    }

    filter({prefix}) {
        return check(this.name, prefix) ||
               check(this.abbreviatedName, prefix);
    }

    toString() {
        return this.name || super.toString();
    }
}

export class TaglibDesc extends GenericDesc {
    /**
     * @param {object} initData
     * @param {string} initData.name
     * @param {string} [initData.shortName]
     * @param {string} [initData.uri]
     * @param {string} [initData.description]
     * @param {TagFunctionDesc[]} [initData.functions]
     * @param {TagDesc[]}         [initData.tags]
     */
    constructor(initData) {
        super(initData.name);
        this.fullName = (initData.fullName || '').trim();
        this.uri = (initData.uri || '').trim();
        this.description = (initData.description || '').trim();

        this.functions = initData.functions || [];
        this.tags = initData.tags || [];
    }

    suggestion({replacementPrefix}) {
        return {
            snippet: `${this.name}:$0`,
            description: this.description,
            type: 'namespace',
            replacementPrefix,
        };
    }
}

export class TagFunctionDesc extends GenericDesc {
    /**
     * @param {object}   initData
     * @param {string}   initData.name
     * @param {TaglibDesc} initData.taglib
     * @param {string}   [initData.class] - package and class the function belongs to
     * @param {string}   [initData.signature]
     * @param {string}   [initData.example]
     * @param {string}   [initData.description]
     * @param {string}   [initData.returnType]
     * @param {string[]} [initData.argumentTypes]
     */
    constructor(initData) {
        super(initData.name);
        this.taglib = initData.taglib;
        this.class = (initData.class || '').trim();
        this.signature = (initData.signature || '').trim();
        this.example = (initData.example || '').trim();
        this.description = (initData.description || '').trim();
        this.returnType = (initData.returnType || '').trim();
        this.shortReturnType = this.returnType ? toShortType(this.returnType) : '';
        this.argumentTypes = initData.argumentTypes || [];
        this.snippet = this.getSnippet();
    }

    getSnippet(ns) {
       const name = this.name;
       const args = this.argumentTypes;
       const argsStr = args
           .map((type, i) => `\${${i+1}:${toShortType(type)}}`)
           .join(', ');

       return `${ns}:${name}(${argsStr})`;
   }

    filter({prefix, usedTaglibs}) {
        let ns;

        usedTaglibs.forEach(item => {
            if (item.desc === this.taglib) {
                ns = item.prefix;
            }
        });

        if (typeof ns === 'undefined') {
            return false;
        }

        ns = ns.toLowerCase();

        if (ns.startsWith(prefix) || prefix.startsWith(ns)) {
            const test1 = `${ns}:${this.name}`.toLowerCase();
            const test2 = `${ns}:${this.abbreviatedName}`.toLowerCase();
            return test1.startsWith(prefix) || test2.startsWith(prefix);
        } else {
            const test1 = `${this.name}`.toLowerCase();
            const test2 = `${this.abbreviatedName}`.toLowerCase();
            return test1.startsWith(prefix) || test2.startsWith(prefix);
        }
    }

    suggestion({replacementPrefix, usedTaglibs}) {
        let ns;

        usedTaglibs.forEach(item => {
            if (item.desc === this.taglib) {
                ns = item.prefix;
            }
        });

        if (typeof ns === 'undefined') {
            throw new Error(`Expected usedTaglibs to contain ${this.tld}`);
        }

        return {
            snippet: this.getSnippet(ns),
            leftLabel: this.shortReturnType,
            description: this.description,
            type: 'function',
            replacementPrefix,
        };
    }
}

export class TagDesc extends GenericDesc {
    /**
     * @param {object} initData
     * @param {string} initData.name
     * @param {TaglibDesc} initData.taglib
     * @param {string} [initData.class]
     * @param {string} [initData.description]
     * @param {string} [initData.content]
     * @param {TagAttrDesc[]} [initData.attributes]
     */
    constructor(initData) {
        super(initData.name);
        this.taglib = initData.taglib;
        this.class = (initData.class || '').trim();
        this.description = (initData.description || '').trim();
        this.content = (initData.content || '').trim();
        this.attributes = initData.attributes || [];
    }

    suggestion({replacementPrefix}) {
        return {
            text: this.name,
            description: this.description,
            type: 'variable',
            replacementPrefix,
        };
    }

    toString() {
        return this.name;
    }
}

export class TagAttrDesc extends GenericDesc {
    /**
     * @param {object}  initData
     * @param {string}  initData.name
     * @param {TagDesc} initData.tag
     * @param {string}  [initData.description]
     * @param {string}  [initData.type]
     * @param {boolean} [initData.required]
     * @param {boolean} [initData.rtexprvalue]
     */
     constructor(initData) {
        super(initData.name);
        this.tag = initData.tag;
        this.description = (initData.description || '').trim();
        this.type = (initData.type || '').trim();
        this.shortType = this.type ? toShortType(this.type) : '';
        this.required = !!initData.required;
        this.rtexprvalue = !!initData.rtexprvalue;
        this.snippet = this.getSnippet();
    }

    getSnippet() {
       if (this.shortType) {
           return `${this.name}="\${1:${this.shortType}}"`;
       } else {
           return `${this.name}="$1"`;
       }
   }

    suggestion({replacementPrefix}) {
        return {
            snippet: this.snippet,
            description: this.description,
            type: 'variable',
            replacementPrefix,
        };
    }
}

export class VarDesc extends GenericDesc {
    /**
     * @param {object} initData
     * @param {string} initData.name
     * @param {string} [initData.description]
     * @param {string} [initData.type]
     */
    constructor(initData) {
        super(initData.name);
        this.description = (initData.description || '').trim();
        this.type = (initData.type || '').trim();
        this.shortType = this.type ? toShortType(this.type) : '';
    }

    suggestion({replacementPrefix}) {
        return {
            text: this.name,
            leftLabel: this.shortType,
            description: this.description,
            type: 'variable',
            replacementPrefix,
        };
    }
}

export class KeywordDesc extends GenericDesc {
    /**
     * @param {object} initData
     * @param {string} initData.keyword
     * @param {string} [initData.fullName]
     * @param {string} [initData.description]
     */
    constructor(initData) {
        super(initData.keyword || initData.name);
        this.fullName = (initData.fullName || '').trim();
        this.description = (initData.description || '').trim();
        this.snippet = this.getSnippet();
    }

    getSnippet() {
        return this.name + ' $0';
    }

    suggestion({replacementPrefix}) {
        return {
            snippet: this.snippet,
            rightLabel: this.fullName,
            description: this.description,
            type: 'keyword',
            replacementPrefix,
        };
    }
}
