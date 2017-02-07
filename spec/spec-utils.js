
const importTaglibStr = '<%@ taglib\nuri="http://example.com/jsp/test" prefix="prefixOfTag" %>\n';

function getProvider(pkg, selector) {
    return pkg.mainModule.getProviders().find(p => p.selector === selector);
}

function mkUtilFunctions ({editor, pkg, provider, VarDesc, sourceTlds, registry}) {
    const functions = {
        getCompletion: (filter, activatedManually=true) => {
            const completions = functions.getCompletions(activatedManually);

            const matchingCompletions = completions
            .filter(comp => (comp.text || comp.snippet).includes(filter));

            return matchingCompletions[0];
        },

        getCompletions: (activatedManually=false) => {
            const cursor = editor.getLastCursor();
            const start = cursor.getBeginningOfCurrentWordBufferPosition();
            const end = cursor.getBufferPosition();
            const prefix = editor.getTextInRange([start, end]);
            const scopeDescriptor = cursor.getScopeDescriptor();
            return provider.getSuggestions({
                bufferPosition: end,
                editor,
                prefix,
                scopeDescriptor,
                activatedManually,
            });
        },

        loadTestTld: () => {
            const testTld = `${pkg.path}/spec/fixtures/tlds/test.tld`;
            return sourceTlds.readAndRegisterTlds([testTld]);
        },


        setContent: (pre, after='') => {
            const text = pre + after;
            editor.setText(text);
            const lines = pre.split(/\n/);
            const lastLineIndex = lines.length - 1;
            const lastColumnIndex = lines[lines.length - 1].length;
            editor.setCursorBufferPosition([lastLineIndex, lastColumnIndex]);
        },

        varInRegistry: (varName) => {
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
