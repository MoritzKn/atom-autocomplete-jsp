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
        it('returns no completions after `<`', () => {
            setContent('<');
            const completions = getCompletions();

            expect(completions.length).toBe(0);
        });

        it('returns completions after `<` when activated manually', () => {
            setContent(importTaglibStr + '<');
            const completions = getCompletions(true);
            console.log(completions.map(t => t.snippet));
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

        it('adds all required attributes', () => {
            setContent(importTaglibStr + '<forEach');
            const completion = getCompletion('prefixOfTag:forEach');

            expect(completion).toBeDefined();
            expect(completion.snippet).toContain('requiredTest="');
        });

        it('adds no attributes that is not required', () => {
            setContent(importTaglibStr + '<forEach');
            const completion = getCompletion('prefixOfTag:forEach');

            expect(completion).toBeDefined();
            expect(completion.snippet).not.toContain('items="');
        });

        it(`is case insensitive'`, () => {
            setContent(importTaglibStr + '<pReFiXofTAg:fOre');
            const completion = getCompletion('forEach');

            expect(completion).toBeDefined();
            expect(completion.replacementPrefix).toBe('pReFiXofTAg:fOre');
        });

        it(`supports abbreviations'`, () => {
            setContent(importTaglibStr + '<fe');
            const completion = getCompletion('forEach');

            expect(completion).toBeDefined();
            expect(completion.replacementPrefix).toBe('fe');
        });
    });

    describe('tag attribute completion', () => {
        // TODO:
    });

    describe('tag attribute value completion', () => {
        // TODO:
    });
});
