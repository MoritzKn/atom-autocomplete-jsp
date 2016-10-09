'use babel';

import * as registry from '../registry';
import {VarDesc} from '../dataClasses';

const varRegExp = /<[a-zA-Z]+:[a-zA-Z]+\s+[^>]*var="([^"]*)"[^>]*>/g;

let version = 0;

const liveTime = 800;
let lastChanged = new Date();

export function register() {
    registry.on('refresh', () => {

        const now = new Date();
        if (lastChanged.getTime() + liveTime > now.getTime()) {
            return;
        }

        let localVersion = version;
        const editor = atom.workspace.getActiveTextEditor();

        editor.getText().replace(varRegExp, (match, varName) => {
            // TODO: check dublicates
            registry.add({
                element: new VarDesc({
                    name: varName,
                }),
                refresh: function() {
                    if (version > localVersion) {
                        this.remove();
                    } else {
                        return this.content;
                    }
                },
            });
        });

        version += 1;
        lastChanged = now;
    });
}
