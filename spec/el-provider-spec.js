// jshint jasmine: true
/* globals waitsForPromise */

const utils = require('./spec-utils');
const {importTaglibStr, getProvider} = utils;

describe('JSP autocompletions EL provider', () => {
    // Dependencies
    let VarDesc;
    let sourceTlds;
    let registry;

    // State
    let editor;
    let pkg;
    let provider;

    // Utils functions
    let getCompletion;
    let getCompletions;
    let loadTestTld;
    let setContent;
    let varInRegistry;

    beforeEach(() => {
        waitsForPromise(() => atom.packages.activatePackage('autocomplete-jsp'));
        waitsForPromise(() => atom.packages.activatePackage('language-java'));
        waitsForPromise(() => atom.workspace.open('test.jsp'));

        runs(() => {
            editor = atom.workspace.getActiveTextEditor();
            pkg = atom.packages.getActivePackage('autocomplete-jsp');
            provider = getProvider(pkg, '.text.html.jsp .el_expression.jsp');

            VarDesc = require(`${pkg.path}/src/desc-classes`).VarDesc;
            registry = require(`${pkg.path}/src/registry`);
            sourceTlds = require(`${pkg.path}/src/sources/tlds`);

            const functions = utils.mkUtilFunctions({
                editor,
                pkg,
                provider,
                VarDesc,
                sourceTlds,
                registry,
            });

            getCompletion = functions.getCompletion;
            getCompletions = functions.getCompletions;
            loadTestTld = functions.loadTestTld;
            setContent = functions.setContent;
            varInRegistry = functions.varInRegistry;
        });
    });

    it('returns no completions inside empty expressions', () => {
        setContent('${', '}');
        const completions = getCompletions();

        expect(Array.isArray(completions)).toBe(true);
        expect(completions.length).toBe(0);
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

        it(`supports abbreviations'`, () => {
            setContent('${foo ip', '}');
            const completion = getCompletion('initParam', true);

            expect(completion).toBeDefined();
        });
    });

    describe('completions for variables defined in tags', () => {
        it('returns completions for variables defined in `<c:set>` tags', () => {
            setContent('<c:set var="fooBarBaz">\n${fooBa', '}');
            waitsFor(() => varInRegistry('fooBarBaz'), 3000);
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
            waitsFor(() => varInRegistry('myMap'), 3000);
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
        it('returns no completions from not imported taglibs', () => {
            waitsForPromise(() => loadTestTld());
            runs(() => {
                setContent('${ts:', '}');
                const completions = getCompletions();

                expect(Array.isArray(completions)).toBe(true);
                expect(completions.length).toBe(0);
            });
        });

        describe('taglibs imports', () => {
            it('returns completions from taglibs imported by taglib directives', () => {
                waitsForPromise(() => loadTestTld());
                runs(() => {
                    const text =  '<%@ taglib\n' +
                        'uri="http://example.com/jsp/test" prefix="prefixOfTag" %>\n' +
                        '${prefixOfTag:';
                    setContent(text, '}');
                    expect(getCompletion('prefixOfTag')).toBeDefined();
                });
            });

            it('returns completions from taglibs imported by XML taglib directives', () => {
                waitsForPromise(() => loadTestTld());
                runs(() => {
                    const text = '<jsp:directive.taglib\n' +
                        'uri="http://example.com/jsp/test" prefix="prefixOfTag"/>\n' +
                        '${prefixOfTag:';
                    setContent(text, '}');
                    expect(getCompletion('prefixOfTag')).toBeDefined();
                });
            });

            it('returns completions from taglibs imported by XML namespace attributes', () => {
                waitsForPromise(() => loadTestTld());
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

                setContent(importTaglibStr + '${prefix', '}');
                expect(getCompletion('prefixOfTag:concat').replacementPrefix).toBe('prefix');

                setContent(importTaglibStr + '${fn:startsWith(prefixOfTag:con', ')}');
                expect(getCompletion('prefixOfTag:concat').replacementPrefix).toBe('prefixOfTag:con');
            });
        });
    });
});
