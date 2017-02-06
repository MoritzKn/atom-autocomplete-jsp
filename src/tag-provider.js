'use babel';

import {getUsedTaglibs} from './get-used-taglibs';
import {extractAttributes} from './utils';
import {TagDesc, VarDesc} from './desc-classes';
import {getAll as getRegistryElements} from './registry';

function includesScope(scopes, scope) {
    return scopes.some(s => s.includes(scope));
}

function isAttributeValue({prefix, scopes}) {
    const lastPrefixCharacter = prefix[prefix.length - 1];
    return lastPrefixCharacter !== '"' &&
           includesScope(scopes, 'string.quoted') &&
           includesScope(scopes, 'meta.tag');
}

function isAttribute({prefix, scopes, preText}) {
    return includesScope(scopes, 'meta.tag') &&
           /\s[a-zA-Z0-9_\-]*$/.test(preText);
}

function isTagStart({prefix, scopes}) {
    if (prefix === '<') {
        if (scopes.length >= 1 && scopes[0] === 'text.html.jsp') {
            switch (scopes.length) {
                case 1: return true;
                case 2: return scopes[1] === 'meta.scope.outside-tag.html';
            }
        }
    } else if (prefix) {
        return includesScope(scopes, 'meta.tag');
    }
    return false;
}

function getAttributeValueSuggestions(request) {
    const {activatedManually, preText} = request;

    const attrMatch = preText.match(/([a-zA-Z0-9]+)="([^"]*)$/);
    if (!attrMatch) {
        return [];
    }

    const tagName = attrMatch[1];
    if (!['var', 'varStatus'].includes(tagName)) {
        return [];
    }

    const replacementPrefix = attrMatch[2];

    if (!activatedManually) {
        const minLen = atom.config.get('autocomplete-plus.minimumWordLength');
        if (replacementPrefix.length < minLen) {
            return [];
        }
    }

    const prefix = replacementPrefix.toLowerCase();
    return getRegistryElements({type: VarDesc})
        .filter(desc => desc.name !== replacementPrefix || desc.type)
        .filter(desc => desc.filter({prefix}))
        .map(desc => desc.suggestion({replacementPrefix}));
}

function getAttributeSuggestions(request) {
    const {editor, bufferPosition, preText, activatedManually} = request;
    const replacementPrefix = request.prefix.trim();

    if (!activatedManually) {
        const minLen = atom.config.get('autocomplete-plus.minimumWordLength');
        if (replacementPrefix.length < minLen) {
            return [];
        }
    }

    const tagMatch = preText.match(/<([a-zA-Z0-9_\-]+):([a-zA-Z0-9_\-]+)([^>]*)$/);

    if (!tagMatch) {
        return [];
    }

    const namespace = tagMatch[1];
    const tagName = tagMatch[2];
    const tagHead = tagMatch[3];

    const usedTaglibs = getUsedTaglibs(preText);
    const taglibDesc = usedTaglibs
        .filter(data => data.prefix === namespace)
        .map(data => data.desc)[0];

    if (!taglibDesc) {
        return [];
    }

    const tagDesc = taglibDesc.tags.filter(tagDesc => tagDesc.name === tagName)[0];

    if (!tagDesc) {
        return [];
    }


    const afterText = editor.buffer.getTextInRange([bufferPosition, editor.buffer.getEndPosition()]);
    const afterTagHeadMatch = (afterText.match(/^[^<]*>/) || {})[0] || '';
    const usedAttributes = Object.keys(extractAttributes(tagHead + afterTagHeadMatch));

    const prefix = replacementPrefix.toLowerCase();
    return tagDesc.attributes
        .filter(desc => !usedAttributes.includes(desc.name))
        .filter(desc => desc.filter({prefix}))
        .map(desc => desc.suggestion({replacementPrefix, namespace}));
}

function getTagSuggestions(request) {
    const {editor, bufferPosition, preText, activatedManually} = request;

    const {replacementPrefix, isClosingTag=false} = (() => {
        const res = preText.match(/<(\/?)([a-zA-Z0-9_\-]+(?::(?:[a-zA-Z0-9_\-]+)?)?)$/);
        if (res) {
            return {
                replacementPrefix: res[2],
                isClosingTag: !!res[1],
            };
        } else {
            return {
                replacementPrefix: request.prefix.replace(/^\s*(?:<\/?)?/, ''),
            };
        }
    }());

    if (!activatedManually) {
        const minLen = atom.config.get('autocomplete-plus.minimumWordLength');
        if (replacementPrefix.length < minLen) {
            return [];
        }
    }

    const usedTaglibs = getUsedTaglibs(preText);
    const prefix = replacementPrefix.toLowerCase();

    const afterText = editor.buffer.getTextInRange([bufferPosition, editor.buffer.getEndPosition()]);
    const onlyTagName = /^[^<]*>/.test(afterText);

    return getRegistryElements({type: TagDesc})
        .filter(desc => desc.filter({prefix, usedTaglibs}))
        .map(desc => desc.suggestion({replacementPrefix, usedTaglibs, isClosingTag, onlyTagName}));
}



export default {
    selector: '.text.html.jsp',
    disableForSelector: '.source.java, .el_expression, .comment',
    inclusionPriority: 50,
    excludeLowerPriority: false, // include html tags etc

    getSuggestions(request) {
        request.scopes = request.scopeDescriptor.getScopesArray();
        const {editor, bufferPosition} = request;
        request.preText = editor.buffer.getTextInRange([[0, 0], bufferPosition]);

        if (isAttributeValue(request)) {
            return getAttributeValueSuggestions(request);
        } else if (isAttribute(request)) {
            return getAttributeSuggestions(request);
        } else if (isTagStart(request)) {
            return getTagSuggestions(request);
        } else {
            return [];
        }
    }
};
