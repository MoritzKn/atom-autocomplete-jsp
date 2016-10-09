'use babel';

import fs from 'fs';
import readInTld from '../readInTld';
import {add as addToRegistry} from '../registry';


export function register() {
    const userHome = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];

    let tldPathes = [];
    // TODO: refresh on config change
    atom.config.get('autocomplete-jsp.tldSources').forEach(dir => {
        dir = dir.replace('~', userHome);

        fs.readdirSync(dir).forEach(fileName => {
            const path = `${dir.replace(/\/$/, '')}/${fileName}`;
            tldPathes.push(path);
        });
    });

    // TODO: when a tld changes, we have to some how reload it..
    Promise.all(tldPathes.map(readInTld))
        .then(tldDescs => {
            tldDescs.forEach(tldDesc => {
                tldDesc.functions.forEach(fnDesc => {
                    addToRegistry({
                        element: fnDesc,
                        // TODO: not Infinity
                        liveTime: Infinity,
                    });
                });

                tldDesc.tags.forEach(tagDesc => {
                    addToRegistry({
                        element: tagDesc,
                        // TODO: not Infinity
                        liveTime: Infinity,
                    });
                });
            });
        })
        .catch(err => {
            atom.notifications.addWarning(err.msg, {
                dismissable: true,
                detail: `Caused by:\n${err.causedBy}`,
            });
        });
}
