'use babel';

import {extractAttributes} from './utils';
import {getAll as getRegistryElements} from './registry';
import {TaglibDesc} from './desc-classes';

const declareTaglibRegExp = new RegExp(
    '<%@\\s+taglib\\s+' +
    '((?:prefix|uri)="[^"]*")\\s+' +
    '((?:prefix|uri)="[^"]*")\\s*',
    'g'
);

const declareTaglibXmlRegExp = new RegExp(
    '<jsp:directive.taglib\\s+' +
    '((?:prefix|uri)="[^"]*")\\s+' +
    '((?:prefix|uri)="[^"]*")\\s*',
    'g'
);

const declareTaglibNsRegExp = new RegExp(
    'xmlns:([^=]+)="([^"]+)"',
    'g'
);

const singleDeclareTaglibNsRegExp = new RegExp(declareTaglibNsRegExp.source);

function getScanText(text) {
    const infos = {
        taglibDeclarationDirectives: [],
        taglibDeclarationNamespaces: [],
        includeDirectives: [],
    };

    [declareTaglibRegExp, declareTaglibXmlRegExp].forEach(regExp => {
        const matches = text.match(regExp);
        if (matches) {
            matches.forEach(matchText => {
                const {prefix, uri} = extractAttributes(matchText);
                infos.taglibDeclarationDirectives.push({prefix, uri});
            });
        }
    });

    {
        const matches = text.match(declareTaglibNsRegExp);
        if (matches) {
            matches.forEach(matchText => {
                const [, prefix, uri] = matchText.match(singleDeclareTaglibNsRegExp);
                infos.taglibDeclarationNamespaces.push({prefix, uri});
            });
        }
        // NOTE: in theory the scope of the taglib declaration ends at the ending tag
        // corresponding to the start tag the namespace declaration belongs to, but we
        // ignore those cases in favor of simplicity.
    }

    return infos;
}

/**
 * Get the loaded tlds
 * @param   {string} text relevant editor content
 * @returns {Array}
 */
export function getDeclaredTaglibs(text) {
    const infos = getScanText(text);
    const uris = {};
    infos.taglibDeclarationDirectives.forEach(dec => uris[dec.uri] = dec.prefix);
    infos.taglibDeclarationNamespaces.forEach(dec => uris[dec.uri] = dec.prefix);

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
