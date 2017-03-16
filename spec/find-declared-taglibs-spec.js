// jshint jasmine: true
// jshint maxlen: 130
/* globals waitsForPromise */

const utils = require('./spec-utils');

describe('Find declared taglibs', () => {
    // Dependencies
    let findDeclaredTaglibs;
    let sourceTlds;
    let registry;

    // State
    let pkg;

    // Utils functions
    let loadTestTld;

    beforeEach(() => {
        waitsForPromise(() => atom.packages.activatePackage('autocomplete-jsp'));

        runs(() => {
            pkg = atom.packages.getActivePackage('autocomplete-jsp');
            sourceTlds = require(`${pkg.path}/src/sources/tlds`);
            registry = require(`${pkg.path}/src/registry`);
            findDeclaredTaglibs = require(`${pkg.path}/src/find-declared-taglibs`).findDeclaredTaglibs;

            const functions = utils.mkUtilFunctions({
                pkg, sourceTlds, registry,
            });

            loadTestTld = functions.loadTestTld;
        });

        waitsForPromise(() => loadTestTld([
            'test.tld',
            'test2.tld',
            'test3.tld',
        ]));
    });

    it('finds taglibs declared by the taglib directive', () => {
        waitsForPromise(() => atom.workspace.open('test.jsp'));

        runs(() => {
            const editor = atom.workspace.getActiveTextEditor();

            const text =  '<%@ taglib\n' +
                'uri="http://example.com/jsp/test" prefix="prefixOfTag" %>\n';
            editor.setText(text);

            waitsForPromise(() => findDeclaredTaglibs(editor.getText(), editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(1);

                const element = taglibs.find(item => item.prefix === 'prefixOfTag');
                expect(element).toBeDefined();
                expect(element.desc.uri).toBe('http://example.com/jsp/test');
            }));
        });
    });

    it('finds taglibs declared by the XML form of the taglib directive', () => {
        waitsForPromise(() => atom.workspace.open('test.jsp'));

        runs(() => {
            const editor = atom.workspace.getActiveTextEditor();

            const text = '<jsp:directive.taglib\n' +
                'uri="http://example.com/jsp/test" prefix="prefixOfTag" />\n';
            editor.setText(text);

            waitsForPromise(() => findDeclaredTaglibs(editor.getText(), editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(1);

                const element = taglibs.find(item => item.prefix === 'prefixOfTag');
                expect(element).toBeDefined();
                expect(element.desc.uri).toBe('http://example.com/jsp/test');
            }));
        });
    });

    it('finds taglibs declared as xml namespace', () => {
        waitsForPromise(() => atom.workspace.open('test.jsp'));


        runs(() => {
            const editor = atom.workspace.getActiveTextEditor();

            const text = '<div xmlns:prefixOfTag="http://example.com/jsp/test"/>\n';
            editor.setText(text);

            waitsForPromise(() => findDeclaredTaglibs(editor.getText(), editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(1);

                const element = taglibs.find(item => item.prefix === 'prefixOfTag');
                expect(element).toBeDefined();
                expect(element.desc.uri).toBe('http://example.com/jsp/test');
            }));
        });
    });

    it('ignores taglibs declarations after the cursor', () => {
        waitsForPromise(() => atom.workspace.open('test.jsp'));

        runs(() => {
            const editor = atom.workspace.getActiveTextEditor();

            const textPre = '<jsp:directive.taglib\n' +
                'uri="http://example.com/jsp/test2" prefix="foo" />\n';

            const textAfter = '<jsp:directive.taglib\n' +
                'uri="http://example.com/jsp/test" prefix="bar" />\n';

            editor.setText(textPre + textAfter);

            waitsForPromise(() => findDeclaredTaglibs(textPre, editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(1);

                const element = taglibs.find(item => item.prefix === 'foo');
                expect(element).toBeDefined();
                expect(element.desc.uri).toBe('http://example.com/jsp/test2');

                const element2 = taglibs.find(item => item.prefix === 'bar');
                expect(element2).toBeUndefined();
            }));
        });
    });


    it('follows include directives and includes taglibs from included files', () => {
        waitsForPromise(() => atom.workspace.open('project-with-includes/main.jsp'));

        runs(() => {
            const editor = atom.workspace.getActiveTextEditor();

            waitsForPromise(() => findDeclaredTaglibs(editor.getText(), editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(3);

                const element = taglibs.find(item => item.prefix === 'test');
                expect(element).toBeDefined();
                expect(element.desc.uri).toBe('http://example.com/jsp/test');

                const element2 = taglibs.find(item => item.prefix === 'test2');
                expect(element2).toBeDefined();
                expect(element2.desc.uri).toBe('http://example.com/jsp/test2');

                const element3 = taglibs.find(item => item.prefix === 'test3');
                expect(element3).toBeDefined();
                expect(element3.desc.uri).toBe('http://example.com/jsp/test3');
            }));
        });
    });

    it('follows include xml directives and includes taglibs from included files', () => {
        waitsForPromise(() => atom.workspace.open('project-with-includes-xml/main.jspx'));

        runs(() => {
            const editor = atom.workspace.getActiveTextEditor();

            waitsForPromise(() => findDeclaredTaglibs(editor.getText(), editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(3);

                const element = taglibs.find(item => item.prefix === 'test');
                expect(element).toBeDefined();
                expect(element.desc.uri).toBe('http://example.com/jsp/test');

                const element2 = taglibs.find(item => item.prefix === 'test2');
                expect(element2).toBeDefined();
                expect(element2.desc.uri).toBe('http://example.com/jsp/test2');

                const element3 = taglibs.find(item => item.prefix === 'test3');
                expect(element3).toBeDefined();
                expect(element3.desc.uri).toBe('http://example.com/jsp/test3');
            }));
        });
    });

    it('stops when it detects a cyclic-include and does not crash', () => {
        waitsForPromise(() => atom.workspace.open('project-with-cyclic-includes/a.jsp'));

        runs(() => {
            const editor = atom.workspace.getActiveTextEditor();

            waitsForPromise(() => findDeclaredTaglibs(editor.getText(), editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(2);

                const element = taglibs.find(item => item.prefix === 'test');
                expect(element).toBeDefined();
                expect(element.desc.uri).toBe('http://example.com/jsp/test');

                const element2 = taglibs.find(item => item.prefix === 'test2');
                expect(element2).toBeDefined();
                expect(element2.desc.uri).toBe('http://example.com/jsp/test2');
            }));
        });
    });

    it('ignores includes that do not exist and does not crash', () => {
        waitsForPromise(() => atom.workspace.open('test.jsp'));


        runs(() => {
            const editor = atom.workspace.getActiveTextEditor();

            const text = '<%@ include file="some/non/existingFile.jsp" %>\n' +
                '<jsp:directive.taglib uri="http://example.com/jsp/test" prefix="test"/>\n';

            editor.setText(text);

            waitsForPromise(() => findDeclaredTaglibs(editor.getText(), editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(1);
                const element = taglibs.find(item => item.prefix === 'test');
                expect(element).toBeDefined();
                expect(element.desc.uri).toBe('http://example.com/jsp/test');
            }));
        });
    });

    it('immediately recognizes changes in the editor', () => {
        waitsForPromise(() => atom.workspace.open('test.jsp'));

        runs(() => {
            const editor = atom.workspace.getActiveTextEditor();

            waitsForPromise(() => findDeclaredTaglibs(editor.getText(), editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(0);
            }));

            runs(() => {
                const text = '<jsp:directive.taglib\n' +
                    'uri="http://example.com/jsp/test" prefix="foo" />\n';
                editor.setText(text);
            });

            waitsForPromise(() => findDeclaredTaglibs(editor.getText(), editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(1);
                expect(taglibs.find(item => item.prefix === 'foo')).toBeDefined();
            }));
        });
    });

    it('resolves absolute paths relative to the webapp directory under src/main/webapp', () => {
        waitsForPromise(() => atom.workspace.open('project-with-absolute-includes/src/main/webapp/foo/bar.jsp'));

        runs(() => {
            const editor = atom.workspace.getActiveTextEditor();

            waitsForPromise(() => findDeclaredTaglibs(editor.getText(), editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(1);
                const element = taglibs.find(item => item.prefix === 'test');
                expect(element).toBeDefined();
                expect(element.desc.uri).toBe('http://example.com/jsp/test');
            }));
        });
    });

    it('resolves absolute paths relative to the directory under src/main/* if no webapp directory exists', () => {
        waitsForPromise(() => atom.workspace.open('project-with-absolute-includes/src/main/resources/foo/bar.jsp'));

        runs(() => {
            const editor = atom.workspace.getActiveTextEditor();

            waitsForPromise(() => findDeclaredTaglibs(editor.getText(), editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(1);
                const element = taglibs.find(item => item.prefix === 'test');
                expect(element).toBeDefined();
                expect(element.desc.uri).toBe('http://example.com/jsp/test');
            }));
        });
    });

    it('prefers src/main/* but also accepts src/*/*', () => {
        waitsForPromise(() => atom.workspace.open('project-with-absolute-includes/src/test/webapp/foo/bar.jsp'));

        runs(() => {
            const editor = atom.workspace.getActiveTextEditor();

            waitsForPromise(() => findDeclaredTaglibs(editor.getText(), editor.getPath()).then(taglibs => {
                expect(taglibs.length).toBe(1);
                const element = taglibs.find(item => item.prefix === 'test');
                expect(element).toBeDefined();
                expect(element.desc.uri).toBe('http://example.com/jsp/test');
            }));
        });
    });


    describe('fs actions', () => {
        const fs = require('fs');
        const path = require('path');

        let changedFile;
        let originalContent;

        afterEach(() => {
            if (changedFile) {
                fs.writeFileSync(changedFile, originalContent, 'utf-8');
                changedFile = null;
            }
        });

        // Fails on OSX on Travis CI for some reason but I was unable to find the problem yet
        xit('recognizes changes in sub-includes after maximal 2000ms', () => {
            waitsForPromise(() => atom.workspace.open('project-with-includes/main.jsp'));

            runs(() => {
                const editor = atom.workspace.getActiveTextEditor();
                const openFile = editor.getPath();

                let resultHasChanged = false;
                function watchForChanges(previousLength) {
                    console.log(`Watch taglibs, currently: ${previousLength}`);
                    const start = Date.now();
                    resultHasChanged = false;

                    (function loop() {
                        console.log(`Scanning`);

                        findDeclaredTaglibs(editor.getText(), openFile).then(taglibs => {

                            console.log(`Now ${taglibs.length}`);

                            if (start + 2000 > Date.now()) {
                                if (taglibs.length !== previousLength) {
                                    console.log(`ResultHasChanged`);
                                    resultHasChanged = true;
                                } else {
                                    jasmine.Clock.real.setTimeout.call(this, () => {
                                        loop();
                                    }, 80);
                                }
                            }
                        });
                    })();
                }

                runs(() => {
                    changedFile = path.resolve(editor.getPath(), '..', 'tlds.jsp');
                    originalContent = fs.readFileSync(changedFile, 'utf-8');

                    waitsForPromise(() => findDeclaredTaglibs(editor.getText(), openFile).then(taglibs => {
                        expect(taglibs.length).toBe(3);
                        fs.writeFileSync(changedFile, '', 'utf-8');
                        watchForChanges(taglibs.length);
                    }));
                });

                waitsFor('the taglibs to disappear', () => resultHasChanged, 2000);

                waitsForPromise(() => findDeclaredTaglibs(editor.getText(), openFile).then(taglibs => {
                    expect(taglibs.length).toBe(1);
                    expect(taglibs.find(item => item.prefix === 'fooBarBazPrefix')).toBeUndefined();

                    const text = '<jsp:directive.taglib\n' +
                        'uri="http://example.com/jsp/test3" prefix="fooBarBazPrefix" />\n';
                        fs.writeFileSync(changedFile, text, 'utf-8');

                    watchForChanges(taglibs.length);
                }));

                waitsFor('the new taglib to appear', () => resultHasChanged, 2000);

                waitsForPromise(() => findDeclaredTaglibs(editor.getText(), openFile).then(taglibs => {
                    expect(taglibs.length).toBe(2);
                    expect(taglibs.find(item => item.prefix === 'fooBarBazPrefix')).toBeDefined();
                }));
            });
        });
    });
});
