const importTaglibStr = '<%@ taglib\nuri="http://example.com/jsp/test" prefix="prefixOfTag" %>\n';

function getProvider(pkg, selector) {
    return pkg.mainModule.getProviders().find(p => p.selector === selector);
}

function mkUtilFunctions ({editor, pkg, provider, sourceTlds, VarDesc, registry}) {
    const functions = {
        getCompletion: (filter, activatedManually=true) => {
            return functions.getCompletions(activatedManually).then(completions => {
                if (!completions) {
                    return undefined;
                }
                return completions.find(comp => (comp.text || comp.snippet).includes(filter));
            });
        },

        getCompletions: (activatedManually=false) => {
            const cursor = editor.getLastCursor();
            const start = cursor.getBeginningOfCurrentWordBufferPosition();
            const end = cursor.getBufferPosition();
            const prefix = editor.getTextInRange([start, end]);
            const scopeDescriptor = cursor.getScopeDescriptor();
            const request = {
                bufferPosition: end,
                editor,
                prefix,
                scopeDescriptor,
                activatedManually,
            };
            return Promise.resolve(provider.getSuggestions(request));
        },

        loadTestTld: (fileNames=['test.tld']) => {
            const testTldsPathes = fileNames.map(fileName => `${pkg.path}/spec/fixtures/tlds/${fileName}`);
            return sourceTlds.readAndRegisterTlds(testTldsPathes);
        },

        setContent: (pre, after='') => {
            const text = pre + after;
            editor.setText(text);
            const lines = pre.split(/\n/);
            const lastLineIndex = lines.length - 1;
            const lastColumnIndex = lines[lines.length - 1].length;
            editor.setCursorBufferPosition([lastLineIndex, lastColumnIndex]);
        },

        varInRegistry: varName => {
            return registry.getAll({
                type: VarDesc,
                filter: [{
                    name: 'name',
                    value: varName,
                }],
            }).length > 0;
        },
    };

    return functions;
}

module.exports = {
    importTaglibStr,
    getProvider,
    mkUtilFunctions,
};
