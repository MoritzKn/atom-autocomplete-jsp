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
        waitsForPromise(() => Promise.all([
            atom.packages.activatePackage('autocomplete-jsp'),
            atom.packages.activatePackage('language-java'),
            atom.workspace.open('test.jsp'),
        ]));

        runs(() => {
            editor = atom.workspace.getActiveTextEditor();
            pkg = atom.packages.getActivePackage('autocomplete-jsp');
            provider = getProvider(pkg, '.text.html.jsp .el_expression.jsp');

            const sourceTags = require(`${pkg.path}/src/sources/tags`);
            sourceTags.setRefreshRate(200);

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

        waitsForPromise(() => getCompletions().then(completions => {
            if (Array.isArray(completions)) {
                expect(completions.length).toBe(0);
            } else {
                expect(completions).toBe(null);
            }
        }));
    });

    describe('completions for keyword', () => {
        ['div', 'mod', 'eq', 'ne', 'lt', 'gt', 'le', 'ge', 'and', 'or', 'not', 'empty'].forEach(keyword => {
            it(`returns a completion for ${keyword} keyword'`, () => {
                setContent('${foo ' + keyword, '}');

                waitsForPromise(() => getCompletion(keyword, true).then(completion => {
                    expect(completion.leftLabel).toBeUndefined();
                    expect(completion.description).toBeTruthy();
                    expect(completion.type).toBe('keyword');
                    expect(completion.replacementPrefix).toBe(keyword);
                }));
            });
        });

        it(`is case insensitive'`, () => {
            setContent('${foo nOt', '}');

            waitsForPromise(() => getCompletion('not', true).then(completion => {
                expect(completion).toBeTruthy();
            }));
        });
    });

    describe('completions for implicit object', () => {
        it('returns a completion for pageContext', () => {
            setContent('${pageCont', '}');

            waitsForPromise(() => getCompletion('pageContext', true).then(completion => {
                expect(completion.leftLabel).toBe('PageContext');
                expect(completion.description).toBeTruthy();
                expect(completion.type).toBe('variable');
                expect(completion.replacementPrefix).toBe('pageCont');
            }));
        });

        it('returns a completion for param', () => {
            setContent('${para', '}');

            waitsForPromise(() => getCompletion('param', true).then(completion => {
                expect(completion.leftLabel).toBe('Map');
                expect(completion.description).toBeTruthy();
                expect(completion.type).toBe('variable');
                expect(completion.replacementPrefix).toBe('para');
            }));
        });

        it('returns a completion for initParam', () => {
            setContent('${initPa', '}');

            waitsForPromise(() => getCompletion('initParam', true).then(completion => {
                expect(completion.leftLabel).toBe('Map');
                expect(completion.description).toBeTruthy();
                expect(completion.type).toBe('variable');
                expect(completion.replacementPrefix).toBe('initPa');
            }));
        });

        it('returns a completion for headerValues', () => {
            setContent('${headerVal', '}');

            waitsForPromise(() => getCompletion('headerValues', true).then(completion => {
                expect(completion.leftLabel).toBe('Map');
                expect(completion.description).toBeTruthy();
                expect(completion.type).toBe('variable');
                expect(completion.replacementPrefix).toBe('headerVal');
            }));
        });

        it(`is case insensitive'`, () => {
            setContent('${foo pAgeCOnT', '}');

            waitsForPromise(() => getCompletion('pageContext', true).then(completion => {
                expect(completion).toBeTruthy();
            }));
        });

        it(`supports abbreviations'`, () => {
            setContent('${foo ip', '}');

            waitsForPromise(() => getCompletion('initParam', true).then(completion => {
                expect(completion).toBeTruthy();
            }));
        });
    });

    describe('completions for variables defined in tags', () => {
        it('returns completions for variables defined in `<c:set>` tags', () => {
            setContent('<c:set var="fooBarBaz">\n${fooBa', '}');
            waitsFor(() => varInRegistry('fooBarBaz'), 3000);

            runs(() => {
                waitsForPromise(() => getCompletion('fooBarBaz').then(completion => {
                    expect(completion.leftLabel).not.toBeTruthy();
                    expect(completion.type).toBe('variable');
                    expect(completion.description).not.toBeTruthy();
                    expect(completion.replacementPrefix).toBe('fooBa');
                }));
            });
        });

        it('returns completions for variables defined in `<jsp:useBean>`', () => {
            setContent('<jsp:useBean id="myMap" class="java.utils.HashMap">\n${myMa', '}');
            waitsFor(() => varInRegistry('myMap'), 3000);

            runs(() => {
                waitsForPromise(() => getCompletion('myMap').then(completion => {
                    expect(completion.leftLabel).toBe('HashMap');
                    expect(completion.type).toBe('variable');
                    expect(completion.description).not.toBeTruthy();
                    expect(completion.replacementPrefix).toBe('myMa');
                }));
            });
        });

        it('allway takes the last useBean', () => {
            setContent(`
                <jsp:useBean id="foo" class="java.utils.HashMap">
                <c:set var="foo" value="bar" />
                <jsp:useBean id="foo" class="java.utils.ArrayList">
                <c:set var="foo" value="bar" />

                \${foo`, '}');

            waitsFor(() => varInRegistry('foo'), 3000);

            runs(() => {
                waitsForPromise(() => getCompletion('foo').then(completion => {
                    expect(completion.leftLabel).toBe('ArrayList');
                    expect(completion.replacementPrefix).toBe('foo');
                }));
            });
        });
    });

    describe('taglibs handling', () => {
        it('returns no completions from not imported taglibs', () => {
            waitsForPromise(() => loadTestTld());

            runs(() => {
                setContent('${ts:', '}');

                waitsForPromise(() => getCompletions().then(completions => {
                    expect(Array.isArray(completions)).toBe(true);
                    expect(completions.length).toBe(0);
                }));
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

                    waitsForPromise(() => getCompletion('prefixOfTag').then(completion => {
                        expect(completion).toBeTruthy();
                    }));
                });
            });

            it('returns completions from taglibs imported by XML taglib directives', () => {
                waitsForPromise(() => loadTestTld());
                runs(() => {
                    const text = '<jsp:directive.taglib\n' +
                        'uri="http://example.com/jsp/test" prefix="prefixOfTag"/>\n' +
                        '${prefixOfTag:';
                    setContent(text, '}');

                    waitsForPromise(() => getCompletion('prefixOfTag').then(completion => {
                        expect(completion).toBeTruthy();
                    }));
                });
            });

            it('returns completions from taglibs imported by XML namespace attributes', () => {
                waitsForPromise(() => loadTestTld());
                runs(() => {
                    const text = '<someTag xmlns:prefixOfTag="http://example.com/jsp/test"/>\n' +
                        '${prefixOfTag:';
                    setContent(text, '}');

                    waitsForPromise(() => getCompletion('prefixOfTag').then(completion => {
                        expect(completion).toBeTruthy();
                    }));
                });
            });
        });

        describe('completions for functions defined in imported taglibs', () => {
            it('is case insensitive', () => {
                setContent(importTaglibStr + '${prEfIxOfTag:cOn', '}');

                waitsForPromise(() => getCompletion('prefixOfTag:concat').then(completion => {
                    expect(completion).toBeTruthy();
                }));
            });

            it('contains the description from the TLD file', () => {
                setContent(importTaglibStr + '${prefixOfTag:con', '}');

                waitsForPromise(() => getCompletion('prefixOfTag:concat').then(completion => {
                    expect(completion.description).toBe('Concatenates two strings.');
                }));
            });

            it('contains the type from the TLD file', () => {
                setContent(importTaglibStr + '${prefixOfTag:con', '}');

                waitsForPromise(() => getCompletion('prefixOfTag:concat').then(completion => {
                    expect(completion.leftLabel).toBe('String');
                }));
            });

            it('is of type function', () => {
                setContent(importTaglibStr + '${prefixOfTag:con', '}');

                waitsForPromise(() => getCompletion('prefixOfTag:concat').then(completion => {
                    expect(completion.type).toBe('function');
                }));
            });

            it('replaces only the namespace and the function name', () => {
                runs(() => {
                    setContent(importTaglibStr + '${prefixOfTag:con', '}');
                });
                waitsForPromise(() => getCompletion('prefixOfTag:concat').then(completion => {
                    expect(completion.replacementPrefix).toBe('prefixOfTag:con');
                }));

                runs(() => {
                    setContent(importTaglibStr + '${prefix', '}');
                });

                waitsForPromise(() => getCompletion('prefixOfTag:concat').then(completion => {
                    expect(completion.replacementPrefix).toBe('prefix');
                }));

                runs(() => {
                    setContent(importTaglibStr + '${fn:startsWith(prefixOfTag:con', ')}');
                });

                waitsForPromise(() => getCompletion('prefixOfTag:concat').then(completion => {
                    expect(completion.replacementPrefix).toBe('prefixOfTag:con');
                }));
            });
        });
    });
});
