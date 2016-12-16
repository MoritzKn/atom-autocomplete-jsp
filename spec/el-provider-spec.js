// jshint jasmine: true
/* globals waitsForPromise */

describe('JSP autocompletions', () => {
    let editor;
    let provider;

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

    beforeEach(() => {
        waitsForPromise(() => atom.packages.activatePackage('autocomplete-jsp'));
        waitsForPromise(() => atom.packages.activatePackage('language-java'));

        runs(() => {
            const pkg = atom.packages.getActivePackage('autocomplete-jsp');
            const providers = pkg.mainModule.getProviders();
            const selector = '.text.html.jsp .el_expression';
            provider = providers.filter(p => p.selector === selector)[0];
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

        const completions = getCompletions(true);

        const matchingCompletions = completions.filter(comp => {
            const completion = comp.text || comp.snippet;
            return completion.includes('not');
        });

        const completion = matchingCompletions[0];
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

        const completions = getCompletions(true);

        const matchingCompletions = completions.filter(comp => {
            const completion = comp.text || comp.snippet;
            return completion.includes('ne');
        });

        const completion = matchingCompletions[0];
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

        const completions = getCompletions(true);

        const matchingCompletions = completions.filter(comp => {
            const completion = comp.text || comp.snippet;
            return completion.includes('initParam');
        });

        const completion = matchingCompletions[0];
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

        const completions = getCompletions(true);

        const matchingCompletions = completions.filter(comp => {
            const completion = comp.text || comp.snippet;
            return completion.includes('initParam');
        });

        const completion = matchingCompletions[0];
        expect(completion).toBeDefined();
    });

    it('returns completions for variables defined in `<c:set var="fooBarBaz">`', (done) => {
        atom.config.set('autocomplete-jsp.tldSources', '');

        editor.setText('');
        editor.buffer.append('<c:set var="fooBarBaz">\n');
        const text = '${fooBa}';
        editor.buffer.append(text);

        editor.setCursorBufferPosition([1, text.length - 1]);

        setTimeout(function () {
            const completions = getCompletions(true);
            const matchingCompletions = completions.filter(comp => {
                const completion = comp.text || comp.snippet;
                return completion.includes('fooBarBaz');
            });

            const completion = matchingCompletions[0];
            expect(completion).toBeDefined();
            if (completion) {
                expect(completion.leftLabel).toBeUndefined();
                expect(completion.type).toBe('variable');
                expect(completion.description).toBeUndefined();
                expect(completion.replacementPrefix).toBe('fooBa:');
            }

            done();
        }, 1000);
    });


    it('returns completions for references from `<jsp:useBean>`', (done) => {
        atom.config.set('autocomplete-jsp.tldSources', '');

        editor.setText('');
        editor.buffer.append('<jsp:useBean id="myMap" class="java.utils.HashMap">\n');
        const text = '${myMa}';
        editor.buffer.append(text);

        editor.setCursorBufferPosition([1, text.length - 1]);

        setTimeout(function () {
            const completions = getCompletions(true);
            const matchingCompletions = completions.filter(comp => {
                const completion = comp.text || comp.snippet;
                return completion.includes('myMap');
            });

            const completion = matchingCompletions[0];
            expect(completion).toBeDefined();
            if (completion) {
                expect(completion.leftLabel).toBe('HashMap');
                expect(completion.type).toBe('variable');
                expect(completion.description).toBeUndefined();
                expect(completion.replacementPrefix).toBe('myMa:');
            }

            done();
        }, 1000);
    });

    it('returns completions from `.tld` files', () => {
        atom.config.set('autocomplete-jsp.tldSources', `${__dirname}/fixtures/tlds/`);

        const text = '${ts:}';
        editor.setText(text);
        editor.setCursorBufferPosition([1, text.length - 1]);

        const completions = getCompletions(true);
        const matchingCompletions = completions.filter(comp => {
            const completion = comp.text || comp.snippet;
            return completion.includes('ts:concat');
        });

        const completion = matchingCompletions[0];
        expect(completion).toBeDefined();
        if (completion) {
            expect(completion.description).toBe('Concatenates two strings.');
            expect(completion.leftLabel).toBe('String');
            expect(completion.type).toBe('function');
            expect(completion.replacementPrefix).toBe('ts:');
        }
    });
});
