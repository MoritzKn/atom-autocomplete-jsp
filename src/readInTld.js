'use babel';

import fs from 'fs';
import xml2js from 'xml2js';

import {TaglibDesc, FunctionDesc, TagDesc, TagAttrDesc} from './dataClasses';
import {shortType} from './utils.js';

const trimObjProps = obj => Object.keys(obj)
    .filter(name => typeof obj[name] === 'string')
    .forEach(name => obj[name] = obj[name].trim());

const parseFnSignature = signature => {
    const matches = signature.match(RegExp(
            // return type
            // e.g. java.lang.String
            '(?:[a-zA-Z][a-zA-Z0-9]*\\.)*([a-zA-Z][a-zA-Z0-9\\[\\]]*)\\s+' +
            // function name
            // e.g. toUpperCase
            '([a-zA-Z][a-zA-Z0-9]*)\\s*' +
            // arguments
            // e.g. (java.lang.String, java.lang.Boolean)
            '\\(\\s*([a-zA-Z0-9,. \\[\\]]*)\\s*\\)'
        ));

    const argumentTypes = matches[3]
        .split(',')
        .map(fullType => shortType(fullType));

    return {
        returnType: matches[1],
        name: matches[2],
        argumentTypes: argumentTypes,
    };
};

const parseBool = str => str !== 'false';

export default path => {
    return new Promise((resolve, reject) => {
        const taglibToDesc = taglib => {
            let desc = new TaglibDesc({
                description: !taglib.description ? '' : taglib.description[0],
                name: taglib['display-name'][0],
                shortName: taglib['short-name'][0],
                uri: taglib.uri[0],

                functions: !taglib.function ? [] : taglib.function.map(fnInfo => {
                    const signature = fnInfo['function-signature'][0];
                    const {returnType, argumentTypes} = parseFnSignature(signature);

                    return new FunctionDesc({
                        name: fnInfo.name[0],
                        class: fnInfo['function-class'][0],
                        description: !fnInfo.description ? '' : fnInfo.description[0],
                        example: !fnInfo.example ? '' : fnInfo.example[0],
                        signature: signature,
                        returnType: returnType,
                        argumentTypes: argumentTypes,
                        namespace: taglib['short-name'][0],
                    });
                }),

                tags: !taglib.tag ? [] : taglib.tag.map(tagInfo => {
                    return new TagDesc({
                        name: tagInfo.name[0],
                        class: tagInfo['tag-class'][0],
                        description: tagInfo.description[0],
                        content: tagInfo['body-content'][0],

                        attributes: !tagInfo.attribute ? [] : tagInfo.attribute.map(attrInfo => {
                            return new TagAttrDesc({
                                name: attrInfo.name[0],
                                description: attrInfo.description[0],
                                type: !attrInfo.type ? '' : attrInfo.type[0],
                                required: parseBool(attrInfo.required[0]),
                                rtexprvalue: parseBool(attrInfo.rtexprvalue[0]),
                            });
                        })
                    });
                })
            });

            trimObjProps(desc);
            desc.functions.forEach(trimObjProps);
            desc.tags.forEach(trimObjProps);
            desc.tags.forEach(tag => tag.attributes.forEach(trimObjProps));

            return resolve(desc);
        };

        fs.readFile(path, {encoding: 'utf8'}, (err, content) => {
            if (err) {
                return reject(err);
            }

            xml2js.parseString(content, (err, {taglib}) => {
                if (err) {
                    return reject(err);
                }

                taglibToDesc(taglib);
            });
        });
    });
};
