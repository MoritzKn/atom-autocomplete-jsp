'use babel';

import {extractAttributes} from './utils';
import {getAll as getRegistryElements} from './registry';
import {TaglibDesc} from './desc-classes';

const useTaglibRegExp = new RegExp(
    '<%@\\s+taglib\\s+' +
    '((?:prefix|uri)="[^"]*")\\s+' +
    '((?:prefix|uri)="[^"]*")\\s*',
    'g'
);

const useTaglibXmlRegExp = new RegExp(
    '<jsp:directive.taglib\\s+' +
    '((?:prefix|uri)="[^"]*")\\s+' +
    '((?:prefix|uri)="[^"]*")\\s*',
    'g'
);

const useTaglibNsRegExp = new RegExp(
    'xmlns:([^=]+)="([^"]+)"',
    'g'
);

/**
 * Get the loaded tlds
 * @param   {string} text relevant editor content
 * @returns {Array}
 */
export function getUsedTaglibs(text) {
    const uris = {};

    [useTaglibRegExp, useTaglibXmlRegExp].forEach(regExp => {
        const tagMatch = text.match(regExp);
        if (tagMatch) {
            tagMatch.forEach(matchText => {
                const attributes = extractAttributes(matchText);
                uris[attributes.uri] = attributes.prefix;
            });
        }
    });

    const attrMatch = text.match(useTaglibNsRegExp);
    if (attrMatch) {
        attrMatch.forEach(matchText => {
            const [, ns, uri] = matchText.match(new RegExp(useTaglibNsRegExp.source));
            uris[uri] = ns;
        });
    }

    return getRegistryElements({
        type: TaglibDesc,
        filter: [{
            name: 'uri',
            values: Object.keys(uris),
        }],
    }, false).map(desc => ({
        prefix: uris[desc.uri],
        desc,
    }));
}
