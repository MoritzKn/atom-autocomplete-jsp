'use babel';

import {check, abbreviate} from './utils';

export class TaglibDesc {
    /**
     * @param {object} initData
     * @param {string} [initData.name]
     * @param {string} [initData.shortName]
     * @param {string} [initData.uri]
     * @param {string} [initData.description]
     *
     * @param {TagFunctionDesc[]} [initData.functions]
     * @param {TagDesc[]}      [initData.tags]
     */
    constructor(initData) {
        this.name = (initData.name || '').trim();
        this.shortName = (initData.shortName || '').trim();
        this.uri = (initData.uri || '').trim();
        this.description = (initData.description || '').trim();
        this.functions = initData.functions || [];
        this.tags = initData.tags || [];
    }
}

const getTagFunctionSnippet = desc => {
    const ns = desc.namespace;
    const name = desc.name;
    const args = desc.argumentTypes
        .map((type, i) => `\${${i + 1}:${type}}`)
        .join(', ');

    return `${ns}:${name}(${args})`;
};

export class TagFunctionDesc {
    /**
     * @param {object}   initData
     * @param {string}   initData.name
     * @param {string}   [initData.class] - package and class the function belongs to
     * @param {string}   [initData.signature]
     * @param {string}   [initData.example]
     * @param {string}   [initData.description]
     * @param {string}   [initData.returnType]
     * @param {string[]} [initData.argumentTypes]
     * @param {string}   [initData.namespace]
     */
    constructor(initData) {
        this.name = initData.name.trim();
        this.abbreviatedName = abbreviate(this.name);
        this.class = (initData.class || '').trim();
        this.signature = (initData.signature || '').trim();
        this.example = (initData.example || '').trim();
        this.description = (initData.description || '').trim();
        this.returnType = (initData.returnType || '').trim();
        this.argumentTypes = initData.argumentTypes || [];
        this.namespace = (initData.namespace || '').trim();
        this.snippet = getTagFunctionSnippet(this);
    }

    filter(prefix) {
        if (this.namespace.startsWith(prefix) || prefix.startsWith(this.namespace)) {
            const test1 = `${this.namespace}:${this.name}`;
            const test2 = `${this.namespace}:${this.abbreviatedName}`;
            return test1.startsWith(prefix) || test2.startsWith(prefix);
        } else {
            const test1 = `${this.name}`;
            const test2 = `${this.abbreviatedName}`;
            return test1.startsWith(prefix) || test2.startsWith(prefix);
        }
    }

    suggestion(prefix) {
        return {
            snippet: this.snippet,
            leftLabel: this.returnType,
            description: this.description,
            type: 'function',
            replacementPrefix: prefix,
        };
    }
}

export class TagDesc {
    /**
     * @param {object} initData
     * @param {string} initData.name
     * @param {string} [initData.class]
     * @param {string} [initData.description]
     * @param {string} [initData.content]
     * @param {TagAttrDesc[]} [initData.attributes]
     */
    constructor(initData) {
        this.name = initData.name.trim();
        this.abbreviatedName = abbreviate(this.name);
        this.class = (initData.class || '').trim();
        this.description = (initData.description || '').trim();
        this.content = (initData.content || '').trim();
        this.attributes = initData.attributes || [];
    }

    filter(prefix) {
        return check(this.name, prefix) || check(this.abbreviatedName, prefix);
    }
}

export class TagAttrDesc {
    /**
     * @param {object}  initData
     * @param {string}  initData.name
     * @param {string}  [initData.description]
     * @param {string}  [initData.type]
     * @param {boolean} [initData.required]
     * @param {boolean} [initData.rtexprvalue]
     */
     constructor(initData) {
        this.name = initData.name.trim();
        this.abbreviatedName = abbreviate(this.name);
        this.description = (initData.description || '').trim();
        this.type = (initData.type || '').trim();
        this.required = !!initData.required;
        this.rtexprvalue = !!initData.rtexprvalue;
    }

    filter(prefix) {
        return check(this.name, prefix) || check(this.abbreviatedName, prefix);
    }
}

export class VarDesc {
    /**
     * @param {object} initData
     * @param {string} initData.name
     * @param {string} [initData.description]
     * @param {string} [initData.type]
     */
    constructor(initData) {
        this.name = initData.name.trim();
        this.abbreviatedName = abbreviate(this.name);
        this.description = (initData.description || '').trim();
        this.type = (initData.type || '').trim();
    }

    filter(prefix) {
        return check(this.name, prefix) || check(this.abbreviatedName, prefix);
    }

    suggestion(prefix) {
        return {
            text: this.name,
            leftLabel: this.type,
            description: this.description,
            type: 'variable',
            replacementPrefix: prefix,
        };
    }
}

export class KeywordDesc {
    /**
     * @param {object} initData
     * @param {string} initData.keyword
     * @param {string} [initData.description]
     */
    constructor(initData) {
        this.keyword = initData.keyword.trim();
        this.description = (initData.description || '').trim();
    }

    filter(prefix) {
        return check(this.keyword, prefix);
    }

    suggestion(prefix) {
        return {
            snippet: this.keyword + ' $0',
            description: this.description,
            type: 'keyword',
            replacementPrefix: prefix,
        };
    }
}
