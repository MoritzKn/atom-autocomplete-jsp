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
        this.name = (initData.name || '').trim();
        this.shortName = (initData.shortName || '').trim();
        this.uri = (initData.uri || '').trim();
        this.description = (initData.description || '').trim();
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
        this.name = (initData.name || '').trim();
        this.class = (initData.class || '').trim();
        this.signature = (initData.signature || '').trim();
        this.example = (initData.example || '').trim();
        this.description = (initData.description || '').trim();
        this.returnType = (initData.returnType || '').trim();
        this.argumentTypes = initData.argumentTypes || [];
        this.namespace = (initData.namespace || '').trim();
    }
}

export class TagDesc {
    /**
     * @param {object} [initData]
     * @param {string} [initData.name]
     * @param {string} [initData.class]
     * @param {string} [initData.description]
     * @param {string} [initData.content]
     * @param {TagAttrDesc[]} [initData.attributes]
     */
    constructor(initData={}) {
        this.name = (initData.name || '').trim();
        this.class = (initData.class || '').trim();
        this.description = (initData.description || '').trim();
        this.content = (initData.content || '').trim();
        this.attributes = initData.attributes || [];
    }
}

export class TagAttrDesc {
    /**
     * @param {object}  [initData]
     * @param {string}  [initData.name]
     * @param {string}  [initData.description]
     * @param {string}  [initData.type]
     * @param {boolean} [initData.required]
     * @param {boolean} [initData.rtexprvalue]
     */
    constructor(initData={}) {
        this.name = (initData.name || '').trim();
        this.description = (initData.description || '').trim();
        this.type = (initData.type || '').trim();
        this.required = !!initData.required;
        this.rtexprvalue = !!initData.rtexprvalue;
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
        this.name = (initData.name || '').trim();
        this.description = (initData.description || '').trim();
        this.type = (initData.type || '').trim();
    }
}
