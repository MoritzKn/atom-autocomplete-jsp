'use babel';

import * as registry from '../registry';
import {VarDesc} from '../desc-classes';
import {extractAttributes} from '../utils';

const varRegExp = /<[a-zA-Z0-9_\-]+:[a-zA-Z0-9_\-]+\s+[^>]*var="([^"]*)"[^>]*>/g;
const useBeanRegExp = /<jsp:useBean[^>]*>/g;

/**
 * The live time of the detected elements i.e. the refresh rate
 * @type {number}
 */

let liveTime = 2000;
let version = 0;
let lastChanged = Date.now();

export function setRefreshRate(rate) {
    liveTime = rate;
}

export function register() {
    registry.on('refresh', () => {

        const now = Date.now();

        if (lastChanged + liveTime > now) {
            return;
        }

        let localVersion = version;
        const editor = atom.workspace.getActiveTextEditor();

        if (!editor) {
            version += 1;
            return;
        }

        const editorText = editor.getText();

        const refreshHandler = function() {
            if (version > localVersion) {
                this.remove();
            } else {
                return this.content;
            }
        };

        (editorText.match(useBeanRegExp) || []).forEach(matchText => {
            const attributes = extractAttributes(matchText);

            const otherRefsEntries = registry.getAllEntries({
                type: VarDesc,
                filter: [{
                    name: 'name',
                    value: attributes.id,
                }],
            }, false);

            if (otherRefsEntries.length > 0) {
                let override = false;
                for (let entry of otherRefsEntries) {
                    const element = entry.get();
                    if (element.type !== attributes.class) {
                        entry.remove();
                        override = true;
                    }
                }

                if (!override) {
                    return;
                }
            }

            registry.add({
                element: new VarDesc({
                    type: attributes.class,
                    name: attributes.id
                }),
                refresh: refreshHandler,
                liveTime,
            });
        });

        (editorText.match(varRegExp) || []).forEach(matchText => {
            const varName = extractAttributes(matchText).var;

            const otherRefs = registry.getAll({
                type: VarDesc,
                filter: [{
                    name: 'name',
                    value: varName,
                }],
            }, false);

            if (otherRefs.length > 0) {
                return;
            }

            registry.add({
                element: new VarDesc({ name: varName }),
                refresh: refreshHandler,
                liveTime,
            });
        });

        version += 1;
        lastChanged = now;
    });
}
