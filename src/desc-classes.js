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
    return longName.match(/([a-zA-Z_][a-zA-Z_0-9\[\]]*(?:\.{3})?)\s*$/)[1];
}

/**
 * Check if something should be suggested
 *
 * @param   {string} name   - name of the function, varible, etc
 * @param   {string} prefix - completion prefix, should be lower case
 * @returns {boolean}       - add suggestion?
 */
function check(name, prefix) {
    if (!name) {
        return false;
    }

    return name.startsWith(prefix) ||
           name.toLowerCase().startsWith(prefix);
}

function getTaglibNamespace(declaredTaglibs, taglib) {
    const item = declaredTaglibs.find(item => item.desc === taglib);
    if (item) {
        return item.prefix;
    } else {
        return undefined;
    }
}

function escapeSnippet(text) {
    return text.replace(/[${}]/g, c => '\\' + c);
}

function snippetJump(index, content='') {
    if (content) {
        return '${' + index + ':' + escapeSnippet(content) + '}';
    } else {
        return '$' + index;
    }
}

function wrapExp(content) {
    return '${' + content + '}';
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
            .map((type, i) => snippetJump(i + 1, toShortType(type)))
            .join(', ');

        return `${ns}:${name}(${argsStr})`;
    }

    filter({prefix, declaredTaglibs}) {
        const ns = getTaglibNamespace(declaredTaglibs, this.taglib);
        if (!ns) {
            return false;
        }
        const nsLower = ns.toLowerCase();
        if (nsLower.startsWith(prefix) || prefix.startsWith(nsLower)) {
            const test1 = `${nsLower}:${this.name}`.toLowerCase();
            const test2 = `${nsLower}:${this.abbreviatedName}`.toLowerCase();
            return test1.startsWith(prefix) || test2.startsWith(prefix);
        } else {
            const test1 = `${this.name}`.toLowerCase();
            const test2 = `${this.abbreviatedName}`.toLowerCase();
            return test1.startsWith(prefix) || test2.startsWith(prefix);
        }
    }

    suggestion({replacementPrefix, declaredTaglibs}) {
        const ns = getTaglibNamespace(declaredTaglibs, this.taglib);
        if (!ns) {
            throw new Error(`Expected declaredTaglibs to contain ${this.tld}`);
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

    getSnippet(ns) {
        const requiredAttrs = this.attributes.filter(attrDesc => attrDesc.required);
        const selfClosing = this.content === 'empty';

        const getEnd = snippetIndex => {
            const notRequiredCount = this.attributes.length - requiredAttrs.length;
            const attrJump = notRequiredCount > 0 ? snippetJump(snippetIndex) : '';

            if (selfClosing) {
                return `${attrJump}/>$0`;
            } else {
                return `${attrJump}>$0</${ns}:${this.name}>`;
            }
        };

        if (requiredAttrs.length > 0) {
            const attrsStr = requiredAttrs
                .map((attrDesc, i) => attrDesc.getSnippet(i + 1))
                .join(' ');

            return `${ns}:${this.name} ${attrsStr}${getEnd(requiredAttrs.length + 1)}`;
        } else {
            return `${ns}:${this.name}${getEnd(1)}`;
        }
    }

    filter({prefix, declaredTaglibs}) {
        const ns = getTaglibNamespace(declaredTaglibs, this.taglib);
        if (!ns) {
            return false;
        }
        const nsLower = ns.toLowerCase();
        if (nsLower.startsWith(prefix) || prefix.startsWith(nsLower)) {
            const test1 = `${nsLower}:${this.name}`.toLowerCase();
            const test2 = `${nsLower}:${this.abbreviatedName}`.toLowerCase();
            return test1.startsWith(prefix) || test2.startsWith(prefix);
        } else {
            const test1 = `${this.name}`.toLowerCase();
            const test2 = `${this.abbreviatedName}`.toLowerCase();
            return test1.startsWith(prefix) || test2.startsWith(prefix);
        }
    }

    suggestion({replacementPrefix, declaredTaglibs, onlyTagName, isClosingTag}) {
        const ns = getTaglibNamespace(declaredTaglibs, this.taglib);
        if (!ns) {
            throw new Error(`Expected "declaredTaglibs" to contain ${this.tld}`);
        }


        const snippet = (() => {
            if (onlyTagName) {
                return `${ns}:${this.name}`;
            } else if (isClosingTag) {
                return `${ns}:${this.name}>`;
            } else {
                return this.getSnippet(ns);
            }
        })();

        return {
            snippet,
            displayText: `${ns}:${this.name}`,
            type: 'tag',
            description: this.description,
            replacementPrefix,
        };
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

    getSnippet(index=1) {
        const value = (() => {
            if (!this.rtexprvalue) {
                return snippetJump(index);
            } else if (this.shortType === 'String') {
                return snippetJump(index, wrapExp(this.shortType));
            } else {
                return wrapExp(snippetJump(index, this.shortType));
            }
        })();

        return `${this.name}="${value}"`;
    }

    suggestion({replacementPrefix, namespace}) {
        const infos = [
            !this.rtexprvalue ? 'static' : null,
            this.shortType,
            this.required ? 'required' : null,
        ];

        const tagNamePrefix = namespace ? namespace + ':' : '';

        return {
            snippet: this.snippet,
            displayText: this.name,
            description: this.description,
            type: 'attribute',
            rightLabel: '<' + tagNamePrefix + this.tag.name + '>',
            leftLabel: infos.filter(el => !!el).join(', '),
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
    }

    suggestion({replacementPrefix}) {
        return {
            text: this.name + ' ',
            rightLabel: this.fullName,
            description: this.description,
            type: 'keyword',
            replacementPrefix,
        };
    }
}

export class ScopeDesc extends GenericDesc {
    /**
     * @param {object} initData
     * @param {string} initData.name
     * @param {string} [initData.description]
     */
    constructor(initData) {
        super(initData.name);
        this.description = (initData.description || '').trim();
    }

    suggestion({replacementPrefix}) {
        return {
            text: this.name,
            description: this.description,
            type: 'namespace',
            replacementPrefix,
        };
    }
}
