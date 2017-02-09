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
        waitsForPromise(() => atom.packages.activatePackage('autocomplete-jsp'));
        waitsForPromise(() => atom.packages.activatePackage('language-html'));
        waitsForPromise(() => atom.packages.activatePackage('language-java'));
        waitsForPromise(() => atom.workspace.open('test.jsp'));

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
            const completions = getCompletions(true);

            expect(completions.length).toBeGreaterThan(0);
        });

        it('returns completions for the namespace', () => {
            setContent(importTaglibStr + '<prefix');
            const completion = getCompletion('forEach');

            expect(completion).toBeDefined();
            expect(completion.replacementPrefix).toBe('prefix');
        });

        it('returns completions for tags with namespace and tag name', () => {
            setContent(importTaglibStr + '<prefixOfTag:for');
            const completion = getCompletion('forEach');

            expect(completion).toBeDefined();
            expect(completion.replacementPrefix).toBe('prefixOfTag:for');
        });

        it('returns completions for tags without the namespace and only the tag name', () => {
            setContent(importTaglibStr + '<for');
            const completion = getCompletion('prefixOfTag:forEach');

            expect(completion).toBeDefined();
            expect(completion.replacementPrefix).toBe('for');
        });

        it('shows the correct information', () => {
            setContent(importTaglibStr + '<forEach');
            const completion = getCompletion('prefixOfTag:forEach');

            expect(completion).toBeDefined();
            expect(completion.snippet).toContain('prefixOfTag:forEach');
            expect(completion.displayText).toBe('prefixOfTag:forEach');
            expect(completion.type).toBe('tag');
            expect(completion.description).toBe('Tag for iteration.');
        });

        it('only closes the tag for closing tags', () => {
            setContent(importTaglibStr + '</prefixOfTag:for');
            const completion = getCompletion('prefixOfTag:forEach');

            expect(completion).toBeDefined();
            expect(completion.snippet).toBe('prefixOfTag:forEach>');
        });

        it('only completes the name for already closed tags', () => {
            setContent(importTaglibStr + '<prefixOfTag:for', '>');
            const completion = getCompletion('prefixOfTag:forEach');

            expect(completion).toBeDefined();
            expect(completion.snippet).toBe('prefixOfTag:forEach');

            setContent(importTaglibStr + '<prefixOfTag:for', 'foo="bar" >');
            const completion2 = getCompletion('prefixOfTag:forEach');

            expect(completion2).toBeDefined();
            expect(completion2.snippet).toBe('prefixOfTag:forEach');
        });

        it('adds all required attributes', () => {
            setContent(importTaglibStr + '<forEach');
            const completion = getCompletion('prefixOfTag:forEach');

            expect(completion).toBeDefined();
            expect(completion.snippet).toContain('requiredTest="');
        });

        it('adds no not required attribute', () => {
            setContent(importTaglibStr + '<forEach');
            const completion = getCompletion('prefixOfTag:forEach');

            expect(completion).toBeDefined();
            expect(completion.snippet).not.toContain('items="');
        });

        it('is case insensitive', () => {
            setContent(importTaglibStr + '<pReFiXofTAg:fOre');
            const completion = getCompletion('forEach');

            expect(completion).toBeDefined();
            expect(completion.replacementPrefix).toBe('pReFiXofTAg:fOre');
        });

        it('supports abbreviations', () => {
            setContent(importTaglibStr + '<fe');
            const completion = getCompletion('forEach');

            expect(completion).toBeDefined();
            expect(completion.replacementPrefix).toBe('fe');
        });
    });

    describe('attribute completion', () => {
        it('returns no completions after white space', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach ');
            const completions = getCompletions();

            expect(completions.length).toBe(0);
        });

        it('returns completions after attribute prefix', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach ite');
            const completions = getCompletions(true);

            expect(completions.length).toBeGreaterThan(0);
        });

        it('shows the correct information', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach ite');
            const completion = getCompletion('items');

            expect(completion).toBeDefined();
            expect(completion.snippet).toContain('items');
            expect(completion.displayText).toBe('items');
            expect(completion.type).toBe('attribute');
            expect(completion.description).toBe('Items to iterate over.');
        });

        it('doesn\'t complete closing tags', () => {
            setContent(importTaglibStr + '</prefixOfTag:forEach ite');
            const completions = getCompletions(true);

            expect(completions.length).toBe(0);
        });

        it('completes no attributes that are not already present', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach it', ' >');
            expect(getCompletion('items')).toBeDefined();

            setContent(importTaglibStr + '<prefixOfTag:forEach items="${foo}" it', ' >');
            expect(getCompletion('items')).toBeUndefined();

            setContent(importTaglibStr + '<prefixOfTag:forEach it', ' items="${foo}">');
            expect(getCompletion('items')).toBeUndefined();
        });

        it('adds no attribute value if the attribute has no rtexprvalue', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach va');
            const completion = getCompletion('var');

            expect(completion).toBeDefined();
            expect(completion.snippet).toBe('var="$1"');
        });

        it('adds the type of the attribute value in an EL expressions', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach beg');
            const completion = getCompletion('begin');

            expect(completion).toBeDefined();
            expect(completion.snippet).toBe('begin="${${1:int}}"');
        });

        it('is case insensitive', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach itEm');
            const completion = getCompletion('items');

            expect(completion).toBeDefined();
            expect(completion.replacementPrefix).toBe('itEm');
        });

        it('supports abbreviations', () => {
            setContent(importTaglibStr + '<prefixOfTag:forEach vs');
            const completion = getCompletion('varStatus');

            expect(completion).toBeDefined();
            expect(completion.replacementPrefix).toBe('vs');
        });
    });

    describe('attribute value completion', () => {
        describe('var attribute', () => {
            it('returns no completions in empty attribute', () => {
                setContent('<foo var="', '">');
                const completions = getCompletions();

                expect(completions.length).toBe(0);
            });

            it('returns completions after a given prefix', () => {
                setContent('<foo var="initPar', '">');
                const completions = getCompletions(true);

                expect(completions.length).toBeGreaterThan(0);
            });

            it('shows the correct information', () => {
                setContent('<foo var="initPar', '">');
                const completion = getCompletion('initParam');

                expect(completion).toBeDefined();
                expect(completion.text).toContain('initParam');
                expect(completion.type).toBe('variable');
            });

            it('is case insensitive', () => {
                setContent('<foo var="iNitpAr', '">');
                const completion = getCompletion('initParam');

                expect(completion).toBeDefined();
                expect(completion.replacementPrefix).toBe('iNitpAr');
            });

            it('supports abbreviations', () => {
                setContent('<foo var="ip', '">');
                const completion = getCompletion('initParam');

                expect(completion).toBeDefined();
                expect(completion.replacementPrefix).toBe('ip');
            });
        });

        describe('scope attribute', () => {
            it('returns no completions in empty attribute', () => {
                setContent('<foo scope="', '">');
                const completions = getCompletions();

                expect(completions.length).toBe(0);
            });

            it('returns completions after a given prefix', () => {
                setContent('<foo scope="req', '">');
                const completions = getCompletions(true);

                expect(completions.length).toBeGreaterThan(0);
            });

            it('shows the correct information', () => {
                setContent('<foo scope="reque', '">');
                const completion = getCompletion('request');

                expect(completion).toBeDefined();
                expect(completion.text).toBe('request');
                expect(completion.type).toBe('namespace');
                expect(completion.replacementPrefix).toBe('reque');
            });

            it('is case insensitive', () => {
                setContent('<foo scope="rEqU', '">');
                const completion = getCompletion('request');

                expect(completion).toBeDefined();
                expect(completion.replacementPrefix).toBe('rEqU');
            });
        });
    });
});
