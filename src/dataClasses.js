'use babel';

export class TaglibDesc {
    /**
     * @param {object} [initData]
     * @param {string} [initData.name]
     * @param {string} [initData.shortName]
     * @param {string} [initData.uri]
     * @param {string} [initData.description]
     *
     * @param {FunctionDesc[]} [initData.functions]
     * @param {TagDesc[]}      [initData.tags]
     */
    constructor(initData={}) {
        this.name = initData.name || '';
        this.shortName = initData.shortName || '';
        this.uri = initData.uri || '';
        this.description = initData.description || '';
        this.functions = initData.functions || [];
        this.tags = initData.tags || [];
    }
}

export class FunctionDesc {
    /**
     * @param {object}   [initData]
     * @param {string}   initData.name
     * @param {string}   [initData.class] - package and class the function belongs to
     * @param {string}   [initData.signature]
     * @param {string}   [initData.example]
     * @param {string}   [initData.description]
     * @param {string}   [initData.returnType]
     * @param {string[]} [initData.argumentTypes]
     * @param {string}   [initData.namespace]
     */
    constructor(initData={}) {
        this.name = initData.name || '';
        this.class = initData.class || '';
        this.signature = initData.signature || '';
        this.example = initData.example || '';
        this.description = initData.description || '';
        this.returnType = initData.returnType || '';
        this.argumentTypes = initData.argumentTypes || [];
        this.namespace = initData.namespace || '';
    }
}

export class TagDesc {
    /**
     * @param {object} [initData]
     * @param {string} {initData.name]
     * @param {string} {initData.class]
     * @param {string} {initData.description]
     * @param {string} {initData.content]
     * @param {TagAttrDesc[]} {initData.ttribute]
     */
    constructor(initData={}) {
        this.name = initData.name || '';
        this.class = initData.class || '';
        this.description = initData.description || '';
        this.content = initData.content || '';
        this.attributes = initData.attributes || [];
    }
}

export class TagAttrDesc {
    /**
     * @param {object} [initData]
     * @param {string} [initData.name]
     * @param {string} [initData.description]
     * @param {string} [initData.type]
     * @param {string} [initData.required]
     * @param {string} [initData.rtexprvalue]
     */
    constructor(initData={}) {
        this.name = initData.name || '';
        this.description = initData.description || '';
        this.type = initData.type || '';
        this.required = initData.required || '';
        this.rtexprvalue = initData.rtexprvalue || '';
    }
}

export class varDesc {
    /**
     * @param {object} [initData]
     * @param {string} [initData.name]
     * @param {string} [initData.description]
     * @param {string} [initData.type]
     */
    constructor(initData={}) {
        this.name = initData.name || '';
        this.description = initData.description || '';
        this.type = initData.type || '';
    }
}
