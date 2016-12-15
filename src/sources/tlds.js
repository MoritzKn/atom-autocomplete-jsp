'use babel';

import fs from 'fs-plus';
import readInTld from '../readInTld';
import {add as addToRegistry} from '../registry';

function readdirProm(path) {
    path = path.replace(/[/\\]$/, '');
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

export function register() {
    // TODO: refresh on config change
    const tldSourceDirs = atom.config.get('autocomplete-jsp.tldSources')
            .map(path => fs.normalize(path));

    Promise.all(tldSourceDirs.map(readdirProm))
        .then(result => [].concat.apply([], result))
        .then(paths => paths.filter(path => path.endsWith('.tld')))
        .then(paths => Promise.all(paths.map(readInTld)))
        .then(tldDescs => tldDescs
            // TODO: reload on file change
            .forEach(tldDesc => {
                tldDesc.functions.forEach(fnDesc =>
                    addToRegistry({
                        element: fnDesc,
                        liveTime: Infinity,
                    })
                );

                tldDesc.tags.forEach(tagDesc =>
                    addToRegistry({
                        element: tagDesc,
                        liveTime: Infinity,
                    })
                );
            })
        )
        .catch(err =>
            atom.notifications.addWarning(`Autocomplete-JSP: ${err.msg}`, {
                dismissable: true,
                detail: `Caused by:\n${err.causedBy}`,
            })
        );
}
