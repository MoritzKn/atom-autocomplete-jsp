'use babel';

import fs from 'fs';
import {abbreviate, getCompletionPrefix} from '../utils';
import readInTld from '../readInTld';

const getTagFunctionSnippet = fnDesc => {
    const ns = fnDesc.namespace;
    const name = fnDesc.name;
    const args = fnDesc.argumentTypes
        .map((type, i) => `\${${i + 1}:${type}}`)
        .join(', ');

    return `${ns}:${name}(${args})`;
};

const userHome = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];

let tldPathes = [];
// TODO: refresh on config change
atom.config.get('autocomplete-jsp.tldSources').forEach(dir => {
     dir = dir.replace('~', userHome);

     fs.readdirSync(dir).forEach(fileName => {
         const path = `${dir.replace(/\/$/, '')}/${fileName}`;
         tldPathes.push(path);
     });
});

let tagFunctions = [];

// TODO: when a tld changes, we have to some how reload it..
Promise.all(tldPathes.map(readInTld))
    .then(tldDescs => {
        tldDescs.forEach(tldDesc => {
            tldDesc.functions.forEach(fnDesc => {
                tagFunctions.push(fnDesc);
            });
        });
    })
    .catch(err => {
        atom.notifications.addWarning(err.msg, {
            dismissable: true,
            detail: `Caused by:\n${err.causedBy}`,
        });
    });

export const getElFunctions = ({editor, bufferPosition}) => {
    let prefix = getCompletionPrefix(editor, bufferPosition);

    if (!prefix) {
        return [];
    } else {
        prefix = prefix.toLowerCase();
    }

    const type = 'function';

    return tagFunctions
        .filter(fnDesc => {
            const abbreviatedName = abbreviate(fnDesc.name);

            if (fnDesc.namespace.startsWith(prefix) || prefix.startsWith(fnDesc.namespace)) {
                const test1 = `${fnDesc.namespace}:${fnDesc.name}`;
                const test2 = `${fnDesc.namespace}:${abbreviatedName}`;
                return test1.startsWith(prefix) || test2.startsWith(prefix);
            } else {
                const test1 = `${fnDesc.name}`;
                const test2 = `${abbreviatedName}`;
                return test1.startsWith(prefix) || test2.startsWith(prefix);
            }
        })
        .map(fnDesc => ({
            replacementPrefix: prefix,
            snippet: getTagFunctionSnippet(fnDesc),
            leftLabel: fnDesc.returnType,
            description: fnDesc.description,
            type: type,
        }));
};
