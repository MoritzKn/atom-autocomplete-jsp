'use babel';

import fs from 'fs-plus';
import xml2js from 'xml2js';
import {TaglibDesc, TagFunctionDesc, TagDesc, TagAttrDesc} from '../desc-classes';
import * as registry from '../registry';
import {getDeepPropSave as gdps} from '../utils';

const methodSignatureRegExp = new RegExp(
    // return type
    // e.g. java.lang.String
    '((?:[a-zA-Z_][a-zA-Z_0-9]*\\.)*[a-zA-Z_][a-zA-Z_0-9\\[\\]]*)\\s+' +
    // function name
    // e.g. toUpperCase
    '([a-zA-Z_][a-zA-Z_0-9]*)\\s*' +
    // arguments
    // e.g. (java.lang.String, java.lang.Boolean)
    '\\(\\s*([a-zA-Z_0-9,.\\s\\[\\]]*)\\s*\\)'
);

function parseMethodSignature(signature) {
    const res = signature.match(methodSignatureRegExp);

    if (!res) {
        throw new Error(`"${signature}" is not a valid method signature`);
    }

    const argumentTypes = res[3]
        .split(',')
        .filter(type => !!type)
        .map(type => type.trim());

    return {
        returnType: res[1],
        name: res[2],
        argumentTypes,
    };
}

function parseBool(str) {
    if (typeof str === 'string') {
        str = str.trim();

        if (str === 'true') {
            return true;
        } else if (str === 'false') {
            return false;
        }
    }

    return !!str;
}

function taglibToDesc(taglib) {
    const shortName = gdps(taglib, 'short-name', 0);
    const name = gdps(taglib, 'display-name', 0);
    const description = gdps(taglib, 'description', 0);
    const uri = gdps(taglib, 'uri', 0);

    const taglibDesc = new TaglibDesc({
        description,
        name: shortName,
        fullName: name,
        uri,
    });

    if (taglib.function) {
        taglibDesc.functions = taglib.function.map(fnInfo => {
            const signature = gdps(fnInfo, 'function-signature', 0);
            const {returnType, argumentTypes} = parseMethodSignature(signature);

            return new TagFunctionDesc({
                name: gdps(fnInfo, 'name', 0),
                class: gdps(fnInfo, 'function-class', 0),
                description: gdps(fnInfo, 'description', 0),
                example: gdps(fnInfo, 'example', 0),
                namespace: shortName,
                taglib: taglibDesc,
                signature,
                returnType,
                argumentTypes,
            });
        });
    }

    if (taglib.tag) {
        taglibDesc.tags = taglib.tag.map(tag => {
            const tagDesc = new TagDesc({
                name: gdps(tag, 'name', 0),
                class: gdps(tag, 'tag-class', 0),
                description: gdps(tag, 'description', 0),
                content: gdps(tag, 'body-content', 0),
                taglib: taglibDesc,
            });

            if (tag.attribute) {
                tagDesc.attributes = tag.attribute.map(attr => {
                    return new TagAttrDesc({
                        name: gdps(attr, 'name', 0),
                        description: gdps(attr, 'description', 0),
                        type: gdps(attr, 'type', 0),
                        required: parseBool(gdps(attr, 'required', 0)),
                        rtexprvalue: parseBool(gdps(attr, 'rtexprvalue', 0)),
                        tag: tagDesc,
                    });
                });
            }

            return tagDesc;
        });
    }

    return taglibDesc;
}

function readInTld(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, {encoding: 'utf8'}, (err, content) => {
            if (err) {
                return reject({
                    msg: `Reading file '${path}' failed`,
                    causedBy: err,
                });
            }

            xml2js.parseString(content, (err, doc) => {
                if (err) {
                    return reject({
                        msg: `Parsing XML in '${path}' failed`,
                        causedBy: err,
                    });
                }

                if (!doc.taglib) {
                    return reject({
                        msg: `Parsing XML in '${path}' failed`,
                        causedBy: new Error(),
                    });
                }

                const taglibDesc = taglibToDesc(doc.taglib);
                return resolve(taglibDesc);
            });
        });
    });
}

function readDir(path) {
    return new Promise((resolve, reject) =>
        fs.readdir(path, (err, fileNames) => {
            if (err) {
                return reject({
                    msg: `Reading directory '${path}' failed`,
                    causedBy: err,
                });
            }

            resolve(fileNames.map(name => `${path}/${name}`));
        })
    );
}

export function readAndRegisterTlds(paths) {


    return Promise.all(paths.map(readInTld).map(prom => prom.then(tldDesc => {
        registry.getAllEntries({
            type: TaglibDesc,
            filter: [{
                name: 'uri',
                value: tldDesc.uri
            }]
        }).forEach(entry => {
            const element = entry.get();

            registry.getAllEntries({
                filter: [{
                    name: 'taglib',
                    value: element
                }]
            }).forEach(entry => entry.remove());

            entry.remove();
        });

        registry.add({ element: tldDesc });
        tldDesc.functions.forEach(desc => registry.add({ element: desc }));
        tldDesc.tags.forEach(desc => registry.add({ element: desc }));
    })));
}

export function register() {
    // TODO: refresh on config change
    const tldSourceDirs = atom.config.get('autocomplete-jsp.tldSources')
            .map(path => fs.normalize(path));

    // TODO: refresh when files change
    Promise.all(tldSourceDirs.map(readDir))
        .then(result => [].concat.apply([], result))
        .then(paths => paths.filter(path => path.endsWith('.tld')))
        .then(paths => readAndRegisterTlds(paths))
        .catch(err => {
            const detail = err.causedBy ? `Caused by:\n${err.causedBy}` : '';
            atom.notifications.addWarning(`Autocomplete-JSP: ${err.msg}`, {
                dismissable: true,
                detail,
            });
        });
}
