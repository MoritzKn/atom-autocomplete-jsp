// jshint jasmine: true
/* globals waitsForPromise */

describe('JSP autocompletions EL provider', () => {
    let editor;
    let provider;
    let pgkPath;

    let VarDesc;
    let registry;
    let sourceTlds;

    function getCompletions(activatedManually=false) {
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
    }

    function getCompletion(filter, activatedManually=false) {
        const completions = getCompletions(activatedManually);

        const matchingCompletions = completions.filter(comp =>
            (comp.text || comp.snippet).includes(filter));

        return matchingCompletions[0];
    }

    function loadTestTld() {
        const testTld = `${pgkPath}/spec/fixtures/tlds/test.tld`;

        waitsForPromise(() =>
            sourceTlds.readAndRegisterTlds([testTld]));
    }

    function varInReg(varName) {
        return registry.getAll({
            type: VarDesc,
            filter: [{
                name: 'name',
                value: varName,
            }],
        }).length > 0;
    }

    function setContent(pre, after='') {
        const text = pre + after;
        editor.setText(text);
        const lines = text.split(/\n/);
        editor.setCursorBufferPosition([lines.length - 1, lines[lines.length - 1].length]);
    }

    beforeEach(() => {
        waitsForPromise(() => atom.packages.activatePackage('autocomplete-jsp'));
        waitsForPromise(() => atom.packages.activatePackage('language-java'));

        runs(() => {
            const pkg = atom.packages.getActivePackage('autocomplete-jsp');
            pgkPath = pkg.path;

            const selector = '.text.html.jsp .el_expression.jsp';
            const providers = pkg.mainModule.getProviders();
            provider = providers.filter(p => p.selector === selector)[0];

            VarDesc = require(`${pgkPath}/src/desc-classes`).VarDesc;
            registry = require(`${pgkPath}/src/registry`);
            sourceTlds = require(`${pgkPath}/src/sources/tlds`);
        });

        waitsForPromise(() => atom.workspace.open('test.jsp'));
        runs(() => editor = atom.workspace.getActiveTextEditor());

        atom.config.set('autocomplete-jsp.tldSources', []);
        atom.config.set('autocomplete-plus.minimumWordLength', 3);
    });


    it('returns no completions when inside an empty expression', () => {
        setContent('${', '}');
        const completions = getCompletions();

        expect(Array.isArray(completions)).toBe(true);
        expect(completions.length).toBe(0);
    });

    it('returns completions inside an empty expression when activated manually', () => {
        setContent('${a', '}');
        const completions = getCompletions(true);

        expect(completions.length).toBeGreaterThan(0);
    });

    it('returns completions for `not` keyword', () => {
        setContent('${not', '}');
        const completion = getCompletion('not', true);

        expect(completion).toBeDefined();
        if (completion) {
            expect(completion.leftLabel).toBeUndefined();
            expect(completion.description).toBeDefined();
            expect(completion.type).toBe('keyword');
            expect(completion.replacementPrefix).toBe('not');
        }
    });

    it('returns completions for `ne` keyword', () => {
        setContent('${foo ne', '}');
        const completion = getCompletion('ne', true);

        expect(completion).toBeDefined();
        if (completion) {
            expect(completion.leftLabel).toBeUndefined();
            expect(completion.rightLabel).toBe('not equal');
            expect(completion.description).toBeDefined();
            expect(completion.type).toBe('keyword');
            expect(completion.replacementPrefix).toBe('ne');
        }
    });

    it('returns completions for the implicit object `initParam`', () => {
        setContent('${initPa', '}');
        const completion = getCompletion('initParam', true);

        expect(completion).toBeDefined();
        if (completion) {
            expect(completion.leftLabel).toBe('Map');
            expect(completion.description).toBeDefined();
            expect(completion.type).toBe('variable');
            expect(completion.replacementPrefix).toBe('initPa');
        }
    });

    it('returns completions `initParam` for the abbreviation `ip`', () => {
        setContent('${ip', '}');
        const completion = getCompletion('initParam', true);

        expect(completion).toBeDefined();
    });

    it('returns completions for variables defined in `<c:set var="fooBarBaz">`', () => {
        const text = '<c:set var="fooBarBaz">\n' +
            '${fooBa';
        setContent(text, '}');
        waitsFor(() => varInReg('fooBarBaz'), 3000);
        runs(() => {
            const completion = getCompletion('fooBarBaz', true);

            expect(completion).toBeDefined();
            if (completion) {
                expect(completion.leftLabel).toBe('');
                expect(completion.type).toBe('variable');
                expect(completion.description).toBe('');
                expect(completion.replacementPrefix).toBe('fooBa');
            }
        });
    });


    it('returns completions for references from `<jsp:useBean>`', () => {
        setContent('<jsp:useBean id="myMap" class="java.utils.HashMap">\n${myMa', '}');
        waitsFor(() => varInReg('myMap'), 3000);
        runs(() => {
            const completion = getCompletion('myMap', true);

            expect(completion).toBeDefined();
            if (completion) {
                expect(completion.leftLabel).toBe('HashMap');
                expect(completion.type).toBe('variable');
                expect(completion.description).toBe('');
                expect(completion.replacementPrefix).toBe('myMa');
            }
        });
    });

    it('returns no completions from `.tld` files if they are not imported', () => {
        loadTestTld();
        runs(() => {
            setContent('${ts:', '}');
            const completion = getCompletion('ts:concat', true);

            expect(completion).toBeUndefined();
        });
    });

    it('returns completions from `.tld` files if imported with taglib directive', () => {
        loadTestTld();
        runs(() => {
            const text =  '<%@ taglib\n' +
                'uri="http://example.com/jsp/test" prefix="prefixOfTag" %>\n' +
                '\n' +
                '${prefixOfTag:';
            setContent(text, '}');
            const completion = getCompletion('prefixOfTag:concat', true);

            expect(completion).toBeDefined();
            if (completion) {
                expect(completion.description).toBe('Concatenates two strings.');
                expect(completion.leftLabel).toBe('String');
                expect(completion.type).toBe('function');
                expect(completion.replacementPrefix).toBe('prefixOfTag:');
            }
        });
    });

    it('returns completions from `.tld` files if imported with xml taglib directive', () => {
        loadTestTld();
        runs(() => {
            const text = '<jsp:directive.taglib ' +
                'uri="http://example.com/jsp/test" ' +
                'prefix="prefixOfTag" />\n' +
                '\n' +
                '${prefixOfTag:';
            setContent(text, '}');
            runs(() => {
                const completion = getCompletion('prefixOfTag:concat', true);

                expect(completion).toBeDefined();
                if (completion) {
                    expect(completion.description).toBe('Concatenates two strings.');
                    expect(completion.leftLabel).toBe('String');
                    expect(completion.type).toBe('function');
                    expect(completion.replacementPrefix).toBe('prefixOfTag:');
                }
            });
        });
    });

    it('returns completions from `.tld` files if imported as xml namespace', () => {
        loadTestTld();
            runs(() => {
            const text = '<jsp:root xmlns:prefixOfTag="http://example.com/jsp/test">\n' +
                '\n' +
                '${prefixOfTag:';
            setContent(text, '}');
            runs(() => {
                const completion = getCompletion('prefixOfTag:concat', true);

                expect(completion).toBeDefined();
                if (completion) {
                    expect(completion.description).toBe('Concatenates two strings.');
                    expect(completion.leftLabel).toBe('String');
                    expect(completion.type).toBe('function');
                    expect(completion.replacementPrefix).toBe('prefixOfTag:');
                }
            });
        });
    });
});
