'use babel';

import fs from 'fs';
import path from 'path';
import {TaglibDesc} from './desc-classes';
import {extractAttributes} from './utils';
import {getAll as getRegistryElements} from './registry';

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

const declareTaglibNsRegExp = /xmlns:([^=]+)="([^"]+)"/g;

const singleDeclareTaglibNsRegExp = new RegExp(declareTaglibNsRegExp.source);

const includeDirectiveRegExp = /<%@\s+include\s+file="([^"]*)"/g;
const includeDirectiveXmlRegExp = /<jsp:directive\.include\s+file="([^"]*)"/g;

const fileInfosCache = {};

function fileStats(filePath) {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if (err) {
                return reject(err);
            }
            resolve(stats);
        });
    });
}

function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, content) => {
            if (err) {
                return reject(err);
            }

            resolve(content);
        });
    });
}

/**
 * Tests whether timestamp A was before timestamp B by a given amount of milliseconds
 *
 * @param {number} a firet timestamp
 * @param {number} b second timestamp
 * @param {number} [amount=0] the amount in ms
 * @returns {boolean}
 */
function wasBefore(a, b, amount=0) {
    return a + amount < b;
}

function scanText(text) {
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

    [includeDirectiveRegExp, includeDirectiveXmlRegExp].forEach(regExp => {
        const matches = text.match(regExp);
        if (matches) {
            matches.forEach(matchText => {
                const {file} = extractAttributes(matchText);
                infos.includeDirectives.push(file);
            });
        }
    });

    return Promise.resolve(infos);
}

function readScanAndCrawl(filePath, includeTrace) {
    return readFile(filePath).then(content => {
        return scanAndCacheAndCrawl(content, filePath, includeTrace);
    });
}

function restoreOrReadAndCrawl(filePath, includeTrace) {
    if (fileInfosCache[filePath]) {
        const cachedfileInfos = fileInfosCache[filePath].fileInfos;
        const lastScan = fileInfosCache[filePath].lastScan;

        if (wasBefore(lastScan, Date.now(), 600)) {
            return fileStats(filePath).then(stats => {
                const lastModified = stats.mtime.getTime();
                if (wasBefore(lastScan, lastModified)) {
                    return readScanAndCrawl(filePath, includeTrace);
                } else {
                    return crawlAndMergeFileInfos(cachedfileInfos, filePath, includeTrace);
                }
            });
        } else {
            return crawlAndMergeFileInfos(cachedfileInfos, filePath, includeTrace);
        }
    } else {
        return readScanAndCrawl(filePath, includeTrace);
    }
}

function crawlAndMergeFileInfos(fileInfos, filePath, includeTrace) {
    const includePathes = fileInfos.includeDirectives.map(relativeIncludePath => {
        return path.resolve(filePath, '..', relativeIncludePath);
    });

    const subCrawlPromises = includePathes
        // prevent endlessly following cyclic-includes
        .filter(includePath => !includeTrace.includes(includePath))
        .map(includePath => {
            const newIncludeTrace = [includePath].concat(includeTrace);
            return restoreOrReadAndCrawl(includePath, newIncludeTrace).catch(err => {
                console.error(`Error reading included file ${includePath}:`, err);
            });
        });


    return Promise.all(subCrawlPromises).then(fileInfosList => {
        fileInfosList = fileInfosList.filter(infos => !!infos);

        const subIncludesList = fileInfosList.map(infos => infos.includeDirectives);
        const subDeclarationsList = fileInfosList.map(infos => infos.taglibDeclarationDirectives);

        const allIncludes = fileInfos.includeDirectives.concat(...subIncludesList);
        const allDeclarations = fileInfos.taglibDeclarationDirectives.concat(...subDeclarationsList);

        return {
            includeDirectives: allIncludes,
            taglibDeclarationDirectives: allDeclarations,

            // NOTE: In theory if a file is included, the file declares a taglib by a xml name spaces
            // declaration and the tag corresponding to the name space declaration is not closed in
            // this file, the scope of the include would expand to the file including it. But we ignore
            // those edge case in favor of favor of simplicity and always end the scope of an include
            // by a xml name space declaration at the end of the file, since we had to allays keep
            // track of opening and closing tags otherwise.
            taglibDeclarationNamespaces: fileInfos.taglibDeclarationNamespaces,
        };
    });
}

function scanAndCacheAndCrawl(content, filePath, includeTrace) {
    return scanText(content).then(fileInfos => {
        fileInfosCache[filePath] = {
            lastScan: Date.now(),
            fileInfos: fileInfos,
        };

        return crawlAndMergeFileInfos(fileInfos, filePath, includeTrace);
    });
}

/**
 * Get the loaded tlds
 * @param   {string} text relevant editor content
 * @returns {Array}
 */
export function findDeclaredTaglibs(text, filePath) {
    const scanPromise = filePath ? scanAndCacheAndCrawl(text, filePath, []) : scanText(text);

    return scanPromise.then((infos) => {
        const uris = {};
        infos.taglibDeclarationNamespaces.forEach(dec => uris[dec.uri] = dec.prefix);
        infos.taglibDeclarationDirectives.forEach(dec => uris[dec.uri] = dec.prefix);

        return getRegistryElements({
            type: TaglibDesc,
            // NOTE:
            // URIs can also be of the form urn:jsptld:path or of the form urn:jsptagdir:path.
            // In that case the UIR isn't necessarily the URI in the TLD but specifies the
            // location of the TLD.
            // See: https://docs.oracle.com/cd/E19575-01/819-3669/bnajs/index.html
            // But this case is not covert yet.
            filter: [{
                name: 'uri',
                values: Object.keys(uris),
            }],
        }, false).map(desc => ({
            prefix: uris[desc.uri],
            desc,
        }));
    });
}
