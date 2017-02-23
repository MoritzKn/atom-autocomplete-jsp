// jshint jasmine: true
/* globals waitsForPromise */

const utils = require('./spec-utils');
const {importTaglibStr, getProvider} = utils;

describe('JSP autocompletions tag provider', () => {
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
            atom.packages.activatePackage('language-html'),
            atom.packages.activatePackage('language-java'),
            atom.workspace.open('test.jsp'),
        ]));

        runs(() => {
            editor = atom.workspace.getActiveTextEditor();
            pkg = atom.packages.getActivePackage('autocomplete-jsp');
            provider = getProvider(pkg, '.text.html.jsp');
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

        waitsForPromise(() => loadTestTld());
    });

    describe('tag completion', () => {
        it('returns completions after `<` when activated manually', () => {
            setContent(importTaglibStr + '<');
            waitsForPromise(() => getCompletions(true).then(completions => {
                expect(completions.length).toBeGreaterThan(0);
            }));
        });

        it('returns completions for the namespace', () => {
            setContent(importTaglibStr + '<prefix');

            waitsForPromise(() => getCompletion('forEach').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.replacementPrefix).toBe('prefix');
            }));
        });

        it('returns completions for tags with namespace and tag name', () => {
            setContent(importTaglibStr + '<prefixOfTag:for');

            waitsForPromise(() => getCompletion('forEach').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.replacementPrefix).toBe('prefixOfTag:for');
            }));
        });

        it('returns completions for tags without the namespace and only the tag name', () => {
            setContent(importTaglibStr + '<for');

            waitsForPromise(() => getCompletion('prefixOfTag:forEach').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.replacementPrefix).toBe('for');
            }));
        });

        it('shows the correct information', () => {
            setContent(importTaglibStr + '<forEach');

            waitsForPromise(() => getCompletion('prefixOfTag:forEach').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.snippet).toContain('prefixOfTag:forEach');
                expect(completion.displayText).toBe('prefixOfTag:forEach');
                expect(completion.type).toBe('tag');
                expect(completion.description).toBe('Tag for iteration.');
            }));
        });

        it('only closes the tag for closing tags', () => {
            setContent(importTaglibStr + '</prefixOfTag:for');

            waitsForPromise(() => getCompletion('prefixOfTag:forEach').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.snippet).toBe('prefixOfTag:forEach>');
            }));
        });

        it('only completes the name for already closed tags', () => {
            setContent(importTaglibStr + '<prefixOfTag:for', '>');

            waitsForPromise(() => getCompletion('prefixOfTag:forEach').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.snippet).toBe('prefixOfTag:forEach');
            }));

            setContent(importTaglibStr + '<prefixOfTag:for', 'foo="bar" >');

            waitsForPromise(() => getCompletion('prefixOfTag:forEach').then(completion => {
                expect(completion).toBeDefined();
                expect(completion.snippet).toBe('prefixOfTag:forEach');
            }));
        });

        it('adds all required attributes', () => {
            setContent(importTaglibStr + '<forEach');

            waitsForPromise(() => getCompletion('prefixOfTag:forEach').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.snippet).toContain('requiredTest="');
            }));
        });

        it('adds no not required attribute', () => {
            setContent(importTaglibStr + '<forEach');

            waitsForPromise(() => getCompletion('prefixOfTag:forEach').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.snippet).not.toContain('items="');
            }));
        });

        it('is case insensitive', () => {
            setContent(importTaglibStr + '<pReFiXofTAg:fOre');

            waitsForPromise(() => getCompletion('forEach').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.replacementPrefix).toBe('pReFiXofTAg:fOre');
            }));
        });

        it('supports abbreviations', () => {
            setContent(importTaglibStr + '<fe');

            waitsForPromise(() => getCompletion('forEach').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.replacementPrefix).toBe('fe');
            }));
        });
    });

    describe('attribute completion', () => {
        it('returns no completions after white space', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach ');

            waitsForPromise(() => getCompletions().then(completions => {
                expect(completions.length).toBe(0);
            }));
        });

        it('returns completions after attribute prefix', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach ite');

            waitsForPromise(() => getCompletions(true).then(completions => {
                expect(completions.length).toBeGreaterThan(0);
            }));
        });

        it('shows the correct information', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach ite');

            waitsForPromise(() => getCompletion('items').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.snippet).toContain('items');
                expect(completion.displayText).toBe('items');
                expect(completion.type).toBe('attribute');
                expect(completion.description).toBe('Items to iterate over.');
            }));
        });

        it('doesn\'t complete closing tags', () => {
            setContent(importTaglibStr + '</prefixOfTag:forEach ite');

            waitsForPromise(() => getCompletions(true).then(completions => {
                expect(completions.length).toBe(0);
            }));
        });

        it('completes no attributes that are already present', () => {
            runs(() => {
                setContent(importTaglibStr + '<prefixOfTag:forEach it', ' >');
            });

            waitsForPromise(() => getCompletion('items').then(completion => {
                expect(completion).toBeDefined();
            }));

            runs(() => {
                setContent(importTaglibStr + '<prefixOfTag:forEach items="${foo}" it', ' >');
            });

            waitsForPromise(() => getCompletion('items').then(completion => {
                expect(completion).toBeUndefined();
            }));

            runs(() => {
                setContent(importTaglibStr + '<prefixOfTag:forEach it', ' items="${foo}">');
            });

            waitsForPromise(() => getCompletion('items').then(completion => {
                expect(completion).toBeUndefined();
            }));
        });

        it('adds no attribute value if the attribute has no rtexprvalue', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach va');

            waitsForPromise(() => getCompletion('var').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.snippet).toBe('var="$1"');
            }));
        });

        it('adds the type of the attribute value in an EL expressions', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach beg');

            waitsForPromise(() => getCompletion('begin').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.snippet).toBe('begin="${${1:int}}"');
            }));
        });

        it('is case insensitive', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach itEm');

            waitsForPromise(() => getCompletion('items').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.replacementPrefix).toBe('itEm');
            }));
        });

        it('supports abbreviations', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach vs');

            waitsForPromise(() => getCompletion('varStatus').then(completion => {
                expect(completion).toBeTruthy();
                expect(completion.replacementPrefix).toBe('vs');
            }));
        });
    });

    describe('attribute value completion', () => {
        describe('var attribute', () => {
            it('returns no completions in empty attribute', () => {
                setContent('<foo var="', '">');

                waitsForPromise(() => getCompletions().then(completions => {
                    expect(completions.length).toBe(0);
                }));
            });

            it('returns completions after a given prefix', () => {
                setContent('<foo var="initPar', '">');

                waitsForPromise(() => getCompletions(true).then(completions => {
                    expect(completions.length).toBeGreaterThan(0);
                }));
            });

            it('shows the correct information', () => {
                setContent('<foo var="initPar', '">');

                waitsForPromise(() => getCompletion('initParam').then(completion => {
                    expect(completion).toBeTruthy();
                    expect(completion.text).toContain('initParam');
                    expect(completion.type).toBe('variable');
                }));
            });

            it('is case insensitive', () => {
                setContent('<foo var="iNitpAr', '">');

                waitsForPromise(() => getCompletion('initParam').then(completion => {
                    expect(completion).toBeTruthy();
                    expect(completion.replacementPrefix).toBe('iNitpAr');
                }));
            });

            it('supports abbreviations', () => {
                setContent('<foo var="ip', '">');

                waitsForPromise(() => getCompletion('initParam').then(completion => {
                    expect(completion).toBeTruthy();
                    expect(completion.replacementPrefix).toBe('ip');
                }));
            });
        });

        describe('scope attribute', () => {
            it('returns no completions in empty attribute', () => {
                setContent('<foo scope="', '">');

                waitsForPromise(() => getCompletions().then(completions => {
                    expect(completions.length).toBe(0);
                }));
            });

            it('returns completions after a given prefix', () => {
                setContent('<foo scope="req', '">');
                waitsForPromise(() => getCompletions(true).then(completions => {
                    expect(completions.length).toBeGreaterThan(0);
                }));
            });

            it('shows the correct information', () => {
                setContent('<foo scope="reque', '">');

                waitsForPromise(() => getCompletion('request').then(completion => {
                    expect(completion).toBeTruthy();
                    expect(completion.text).toBe('request');
                    expect(completion.type).toBe('namespace');
                    expect(completion.replacementPrefix).toBe('reque');
                }));
            });

            it('is case insensitive', () => {
                setContent('<foo scope="rEqU', '">');

                waitsForPromise(() => getCompletion('request').then(completion => {
                    expect(completion).toBeTruthy();
                    expect(completion.replacementPrefix).toBe('rEqU');
                }));
            });
        });
    });
});
