'use babel';

import fs from 'fs';
import readInTld from '../readInTld';
import {add as addToRegistry} from '../registry';


export function register() {
    const userHome = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];
    const tldSources = atom.config.get('autocomplete-jsp.tldSources');

    // TODO: refresh on config change
    Promise.all(tldSources
            .map(path => path = path.replace('~', userHome))
            .map(path => new Promise((resolve, reject) =>
                fs.readdir(path, (err, fileNames) => {
                    if (err) {
                        return reject(err);
                    }


                    resolve(fileNames
                        .filter(name => name.endsWith('.tld'))
                        .map(name => `${path.replace(/\/$/, '')}/${name}`)
                    );
                })
            ))
        )
        // TODO: reload on change
        .then(result => Promise.all(result
                .reduce((all, next) => all.concat(next), [])
                .map(readInTld)
            )
        )
        .then(tldDescs => tldDescs
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
            atom.notifications.addWarning(err.msg, {
                dismissable: true,
                detail: `Caused by:\n${err.causedBy}`,
            })
        );
}
