'use babel';

import fs from 'fs';
import {mkSimpleSuggestionFilter, getCompletionPrefix} from '../utils';
import readInTld from '../readInTld';

const getTagFunctionSnippet = fnDesc => {
    const ns = fnDesc.namespace;
    const name = fnDesc.name;
    const args = fnDesc.argumentTypes
        .map((type, i) => `\${${i + 1}:${type}}`)
        .join(', ');

    return `${ns}:${name}(${args})`;
};

// TODO: use config
// atom.config.get('autocomplete-jsp.tldSources')
const packagePath = atom.packages.getPackageDirPaths() + '/autocomplete-jsp';
const dir = `${packagePath}/tlds`;
const tldPathes = fs.readdirSync(dir).map(fileName =>
        `${dir.replace(/\/$/, '')}/${fileName}`);

let tagFunctions = [];

// TODO: if a tld changes, we have to some how reload it..
Promise.all(tldPathes.map(readInTld))
    .then(tldDescs => {
        tldDescs.forEach(tldDesc => {
            tldDesc.functions.forEach(fnDesc => {
                tagFunctions.push(fnDesc);
            });
        });
    })
    .catch(err => {
        console.error(err);
    });

export const getElFunctions = ({editor, bufferPosition}) => {
    const prefix = getCompletionPrefix(editor, bufferPosition);

    if (!prefix) {
        return [];
    }

    const filter = mkSimpleSuggestionFilter(prefix);
    const type = 'function';

    return tagFunctions
        .filter(fnDesc =>
            filter(fnDesc.namespace + ':' + fnDesc.name))
        .map(fnDesc => ({
            replacementPrefix: prefix,
            snippet: getTagFunctionSnippet(fnDesc),
            leftLabel: fnDesc.returnType,
            description: fnDesc.description,
            type: type,
        }));
};
