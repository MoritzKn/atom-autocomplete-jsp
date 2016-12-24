// jshint jasmine: true
/* globals waitsForPromise */

describe('JSP autocompletions', () => {
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

    beforeEach(() => {
        waitsForPromise(() => atom.packages.activatePackage('autocomplete-jsp'));
        waitsForPromise(() => atom.packages.activatePackage('language-java'));

        runs(() => {
            const pkg = atom.packages.getActivePackage('autocomplete-jsp');
            pgkPath = atom.packages.loadPackage('autocomplete-jsp').path;

            const selector = '.text.html.jsp .el_expression';
            const providers = pkg.mainModule.getProviders();
            provider = providers.filter(p => p.selector === selector)[0];

            VarDesc = require(`${pgkPath}/src/desc-classes`).VarDesc;
            registry = require(`${pgkPath}/src/registry`);
            sourceTlds = require(`${pgkPath}/src/sources/tlds`);
        });

        waitsForPromise(() => atom.workspace.open('test.jsp'));
        runs(() => editor = atom.workspace.getActiveTextEditor());
    });


    it('returns no completions when inside an empty expression', () => {
        atom.config.set('autocomplete-jsp.tldSources', '');
        atom.config.set('autocomplete-plus.minimumWordLength', 3);

        editor.setText('${}');
        editor.setCursorBufferPosition([0, 2]);

        const completions = getCompletions();

        expect(Array.isArray(completions)).toBe(true);
        expect(completions.length).toBe(0);
    });

    it('returns completions inside an empty expression when activatedManually', () => {
        atom.config.set('autocomplete-jsp.tldSources', '');
        atom.config.set('autocomplete-plus.minimumWordLength', 3);

        editor.setText('${a}');
        editor.setCursorBufferPosition([0, 3]);

        const completions = getCompletions(true);
        expect(completions.length).toBeGreaterThan(0);
    });

    it('returns completions for `not` keyword', () => {
        atom.config.set('autocomplete-jsp.tldSources', '');

        const text = '${not}';
        editor.setText(text);
        editor.setCursorBufferPosition([0, text.length - 1]);

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
        atom.config.set('autocomplete-jsp.tldSources', '');

        const text = '${foo ne}';
        editor.setText(text);
        editor.setCursorBufferPosition([0, text.length - 1]);

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
        atom.config.set('autocomplete-jsp.tldSources', '');

        const text = '${initPa}';
        editor.setText(text);
        editor.setCursorBufferPosition([0, text.length - 1]);

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
        atom.config.set('autocomplete-jsp.tldSources', '');

        const text = '${ip}';
        editor.setText(text);
        editor.setCursorBufferPosition([0, text.length - 1]);

        const completion = getCompletion('initParam', true);
        expect(completion).toBeDefined();
    });

    it('returns completions for variables defined in `<c:set var="fooBarBaz">`', () => {
        atom.config.set('autocomplete-jsp.tldSources', '');

        editor.setText('');
        editor.buffer.append('<c:set var="fooBarBaz">\n');
        const text = '${fooBa}';
        editor.buffer.append(text);
        editor.setCursorBufferPosition([1, text.length - 1]);

        waitsFor(() => varInReg('fooBarBaz'), 1200);

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
        atom.config.set('autocomplete-jsp.tldSources', '');

        editor.setText('');
        editor.buffer.append('<jsp:useBean id="myMap" class="java.utils.HashMap">\n');
        const text = '${myMa}';
        editor.buffer.append(text);
        editor.setCursorBufferPosition([1, text.length - 1]);

        waitsFor(() => varInReg('myMap'), 1200);

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
        atom.config.set('autocomplete-jsp.tldSources', `${__dirname}/fixtures/tlds/`);
        loadTestTld();

        const text = '${ts:}';
        editor.setText(text);
        editor.setCursorBufferPosition([1, text.length - 1]);

        runs(() => {
            const completion = getCompletion('ts:concat', true);
            expect(completion).toBeUndefined();
        });
    });

    it('returns completions from `.tld` files if imported with taglib directive', () => {
        atom.config.set('autocomplete-jsp.tldSources', `${__dirname}/fixtures/tlds/`);
        loadTestTld();

        editor.setText('');
        editor.buffer.append('<%@ taglib\n');
        editor.buffer.append('uri="http://example.com/jsp/test" prefix="prefixOfTag" %>\n');
        editor.buffer.append('\n');
        const text = '${prefixOfTag:}';
        editor.buffer.append(text);
        editor.setCursorBufferPosition([3, text.length - 1]);

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

    it('returns completions from `.tld` files if imported with xml taglib directive', () => {
        atom.config.set('autocomplete-jsp.tldSources', `${__dirname}/fixtures/tlds/`);
        loadTestTld();

        editor.setText('');
        editor.buffer.append('<jsp:directive.taglib uri="http://example.com/jsp/test" prefix="prefixOfTag" />\n');
        editor.buffer.append('\n');
        const text = '${prefixOfTag:}';
        editor.buffer.append(text);
        editor.setCursorBufferPosition([2, text.length - 1]);

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

    it('returns completions from `.tld` files if imported as xml namespace', () => {
        atom.config.set('autocomplete-jsp.tldSources', `${__dirname}/fixtures/tlds/`);
        loadTestTld();

        editor.setText('');
        editor.buffer.append('<jsp:root xmlns:prefixOfTag="http://example.com/jsp/test">\n');
        editor.buffer.append('\n');
        const text = '${prefixOfTag:}';
        editor.buffer.append(text);

        editor.setCursorBufferPosition([2, text.length - 1]);

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
