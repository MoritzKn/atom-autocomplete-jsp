'use babel';

import fs from 'fs';
import xml2js from 'xml2js';

import {TaglibDesc, TagFunctionDesc, TagDesc, TagAttrDesc} from './dataClasses';
import {shortType} from './utils.js';

const parseFnSignature = signature => {
    const matches = signature.match(RegExp(
            // return type
            // e.g. java.lang.String
            '(?:[a-zA-Z_][a-zA-Z_0-9]*\\.)*([a-zA-Z_][a-zA-Z_0-9\\[\\]]*)\\s+' +
            // function name
            // e.g. toUpperCase
            '([a-zA-Z_][a-zA-Z_0-9]*)\\s*' +
            // arguments
            // e.g. (java.lang.String, java.lang.Boolean)
            '\\(\\s*([a-zA-Z_0-9,. \\[\\]]*)\\s*\\)'
        ));

    const argumentTypes = matches[3]
        .split(',')
        .filter(type => !!type)
        .map(fullType => shortType(fullType));

    return {
        returnType: matches[1],
        name: matches[2],
        argumentTypes: argumentTypes,
    };
};

const parseBool = str => str !== 'false';

const getPropSave = (obj, ...path) => {
    let lastEL = obj;
    path.forEach(key => {
        if (typeof lastEL !== 'object') {
            return undefined;
        }
        lastEL = lastEL[key];
    });
    return lastEL;
};

const taglibToDesc = taglib => {
    const shortName = getPropSave(taglib, 'short-name', 0);
    const name = getPropSave(taglib, 'display-name', 0);
    const description = getPropSave(taglib, 'description', 0);
    const uri = getPropSave(taglib, 'uri', 0);

    const functions = !taglib.function ? [] : taglib.function.map(fnInfo => {
        const signature = getPropSave(fnInfo, 'function-signature', 0);
        const {returnType, argumentTypes} = parseFnSignature(signature);

        return new TagFunctionDesc({
            name: getPropSave(fnInfo, 'name', 0),
            class: getPropSave(fnInfo, 'function-class', 0),
            description: getPropSave(fnInfo, 'description', 0),
            example: getPropSave(fnInfo, 'example', 0),
            namespace: shortName,
            signature,
            returnType,
            argumentTypes,
        });
    });

    const tags = !taglib.tag ? [] : taglib.tag.map(tagInfo => {
        return new TagDesc({
            name: getPropSave(tagInfo, 'name', 0),
            class: getPropSave(tagInfo, 'tag-class', 0),
            description: getPropSave(tagInfo, 'description', 0),
            content: getPropSave(tagInfo, 'body-content', 0),
            namespace: shortName,

            attributes: !tagInfo.attribute ? [] : tagInfo.attribute.map(attrInfo => {
                return new TagAttrDesc({
                    name: getPropSave(attrInfo, 'name', 0),
                    description: getPropSave(attrInfo, 'description', 0),
                    type: getPropSave(attrInfo, 'type', 0),
                    required: parseBool(getPropSave(attrInfo, 'required', 0)),
                    rtexprvalue: parseBool(getPropSave(attrInfo, 'rtexprvalue', 0)),
                });
            })
        });
    });

    let desc = new TaglibDesc({
        description,
        name,
        shortName,
        uri,
        functions,
        tags,
    });

    return desc;
};

export default path => {
    return new Promise((resolve, reject) => {

        fs.readFile(path, {encoding: 'utf8'}, (err, content) => {
            if (err) {
                return reject({
                    msg: `Reading file '${path}' failed`,
                    causedBy: err,
                });
            }

            xml2js.parseString(content, (err, {taglib}) => {
                if (err) {
                    return reject({
                        msg: `Parsing XML in '${path}' failed`,
                        causedBy: err,
                    });
                }

                const taglibDesc = taglibToDesc(taglib);
                return resolve(taglibDesc);
            });
        });
    });
};
