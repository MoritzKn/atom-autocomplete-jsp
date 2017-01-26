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

        const matchingCompletions = completions
            .filter(comp => (comp.text || comp.snippet).includes(filter));

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

    it('returns no completions inside empty expressions', () => {
        setContent('${', '}');
        const completions = getCompletions();

        expect(Array.isArray(completions)).toBe(true);
        expect(completions.length).toBe(0);
    });

    it('returns completions inside empty expressions when activated manually', () => {
        setContent('${a', '}');
        const completions = getCompletions(true);

        expect(completions.length).toBeGreaterThan(0);
    });

    describe('completions for keyword', () => {
        ['div', 'mod', 'eq', 'ne', 'lt', 'gt', 'le', 'ge', 'and', 'or', 'not', 'empty'].forEach(keyword => {
            it(`returns a completion for ${keyword} keyword'`, () => {
                setContent('${foo ' + keyword, '}');
                const completion = getCompletion(keyword, true);

                expect(completion).toBeDefined();
                if (completion) {
                    expect(completion.leftLabel).toBeUndefined();
                    expect(completion.description).toBeDefined();
                    expect(completion.type).toBe('keyword');
                    expect(completion.replacementPrefix).toBe(keyword);
                }
            });
        });

        it(`is case insensitive'`, () => {
            setContent('${foo nOt', '}');
            const completion = getCompletion('not', true);

            expect(completion).toBeDefined();
        });
    });

    describe('completions for implicit object', () => {
        it('returns a completion for pageContext', () => {
            setContent('${pageCont', '}');
            const completion = getCompletion('pageContext', true);

            expect(completion).toBeDefined();
            if (completion) {
                expect(completion.leftLabel).toBe('PageContext');
                expect(completion.description).toBeDefined();
                expect(completion.type).toBe('variable');
                expect(completion.replacementPrefix).toBe('pageCont');
            }
        });

        it('returns a completion for param', () => {
            setContent('${para', '}');
            const completion = getCompletion('param', true);

            expect(completion).toBeDefined();
            if (completion) {
                expect(completion.leftLabel).toBe('Map');
                expect(completion.description).toBeDefined();
                expect(completion.type).toBe('variable');
                expect(completion.replacementPrefix).toBe('para');
            }
        });

        it('returns a completion for initParam', () => {
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

        it('returns a completion for headerValues', () => {
            setContent('${headerVal', '}');
            const completion = getCompletion('headerValues', true);

            expect(completion).toBeDefined();
            if (completion) {
                expect(completion.leftLabel).toBe('Map');
                expect(completion.description).toBeDefined();
                expect(completion.type).toBe('variable');
                expect(completion.replacementPrefix).toBe('headerVal');
            }
        });

        it(`is case insensitive'`, () => {
            setContent('${foo pAgeCOnT', '}');
            const completion = getCompletion('pageContext', true);

            expect(completion).toBeDefined();
        });

        it(`it supports abbreviations'`, () => {
            setContent('${foo ip', '}');
            const completion = getCompletion('initParam', true);

            expect(completion).toBeDefined();
        });
    });

    describe('completions for variables defined in tags', () => {
        it('returns completions for variables defined in `<c:set>` tags', () => {
            setContent('<c:set var="fooBarBaz">\n${fooBa', '}');
            waitsFor(() => varInReg('fooBarBaz'), 3000);
            runs(() => {
                const completion = getCompletion('fooBarBaz');

                expect(completion).toBeDefined();
                if (completion) {
                    expect(completion.leftLabel).not.toBeTruthy();
                    expect(completion.type).toBe('variable');
                    expect(completion.description).not.toBeTruthy();
                    expect(completion.replacementPrefix).toBe('fooBa');
                }
            });
        });

        it('returns completions for variables defined in `<jsp:useBean>`', () => {
            setContent('<jsp:useBean id="myMap" class="java.utils.HashMap">\n${myMa', '}');
            waitsFor(() => varInReg('myMap'), 3000);
            runs(() => {
                const completion = getCompletion('myMap');

                expect(completion).toBeDefined();
                if (completion) {
                    expect(completion.leftLabel).toBe('HashMap');
                    expect(completion.type).toBe('variable');
                    expect(completion.description).not.toBeTruthy();
                    expect(completion.replacementPrefix).toBe('myMa');
                }
            });
        });
    });

    describe('taglibs handling', () => {
        const importTaglibStr = '<%@ taglib\nuri="http://example.com/jsp/test" prefix="prefixOfTag" %>\n';

        it('returns no completions from not imported taglibs', () => {
            loadTestTld();
            runs(() => {
                setContent('${ts:', '}');
                const completions = getCompletions();

                expect(completions.length).toBe(0);
            });
        });

        describe('taglibs imports', () => {
            it('returns completions from taglibs imported by taglib directives', () => {
                loadTestTld();
                runs(() => {
                    const text =  '<%@ taglib\n' +
                        'uri="http://example.com/jsp/test" prefix="prefixOfTag" %>\n' +
                        '${prefixOfTag:';
                    setContent(text, '}');
                    expect(getCompletion('prefixOfTag')).toBeDefined();
                });
            });

            it('returns completions from taglibs imported by XML taglib directives', () => {
                loadTestTld();
                runs(() => {
                    const text = '<jsp:directive.taglib\n' +
                        'uri="http://example.com/jsp/test" prefix="prefixOfTag"/>\n' +
                        '${prefixOfTag:';
                    setContent(text, '}');
                    expect(getCompletion('prefixOfTag')).toBeDefined();
                });
            });

            it('returns completions from taglibs imported by XML namespace attributes', () => {
                loadTestTld();
                runs(() => {
                    const text = '<someTag xmlns:prefixOfTag="http://example.com/jsp/test"/>\n' +
                        '${prefixOfTag:';
                    setContent(text, '}');
                    expect(getCompletion('prefixOfTag')).toBeDefined();
                });
            });
        });

        describe('completions for functions defined in imported taglibs', () => {
            it('is case insensitive', () => {
                setContent(importTaglibStr + '${prEfIxOfTag:cOn', '}');
                expect(getCompletion('prefixOfTag:concat')).toBeDefined();
            });

            it('contains the description from the TLD file', () => {
                setContent(importTaglibStr + '${prefixOfTag:con', '}');
                expect(getCompletion('prefixOfTag:concat').description).toBe('Concatenates two strings.');
            });

            it('contains the type from the TLD file', () => {
                setContent(importTaglibStr + '${prefixOfTag:con', '}');
                expect(getCompletion('prefixOfTag:concat').leftLabel).toBe('String');
            });

            it('is of type function', () => {
                setContent(importTaglibStr + '${prefixOfTag:con', '}');
                expect(getCompletion('prefixOfTag:concat').type).toBe('function');
            });

            it('replaces only the namespace and the function name', () => {
                setContent(importTaglibStr + '${prefixOfTag:con', '}');
                expect(getCompletion('prefixOfTag:concat').replacementPrefix).toBe('prefixOfTag:con');

                setContent(importTaglibStr + '${test:foo(prefixOfTag:con', ')}');
                expect(getCompletion('prefixOfTag:concat').replacementPrefix).toBe('prefixOfTag:con');

                setContent(importTaglibStr + '${prefix}');
                expect(getCompletion('prefixOfTag:concat').replacementPrefix).toBe('prefix');
            });
        });
    });
});
