'use babel';

import * as registry from '../registry';
import {VarDesc} from '../desc-classes';
import {extractAttributes} from '../utils';

const varRegExp = /<[a-zA-Z0-9_\-]+:[a-zA-Z0-9_\-]+\s+[^>]*var="([^"]*)"[^>]*>/g;
const useBeanRegExp = /<jsp:useBean\s+[^>]*((?:class|id)="[^"]*")\s+[^>]*((?:class|id)="[^"]*"\s*)[^>]*\/?>/g;

/**
 * The live time of the detected elements i.e. the refresh rate
 * @type {number}
 */
const liveTime = 2000;

let version = 0;
let lastChanged = Date.now();

export function register() {
    registry.on('refresh', () => {

        const now = Date.now();

        if (lastChanged + liveTime > now) {
            return;
        }

        let localVersion = version;
        const editorText = atom.workspace.getActiveTextEditor().getText();

        const refreshHandler = function() {
            if (version > localVersion) {
                this.remove();
            } else {
                return this.content;
            }
        };

        editorText.replace(useBeanRegExp, (matchText) => {
            const attributes = extractAttributes(matchText);

            const idValue = attributes.id;
            const classValue = attributes.class;

            const otherRefs = registry.getAll({
                type: VarDesc,
                filter: [{
                    name: 'name',
                    value: idValue,
                }],
            }, false);

            if (otherRefs.length > 0) {
                return;
            }

            registry.add({
                element: new VarDesc({
                    type: classValue,
                    name: idValue
                }),
                refresh: refreshHandler,
            });
        });

        // Use replace because it's the only way to get all matches and all groups
        editorText.replace(varRegExp, (matchText, name) => {
            const otherRefs = registry.getAll({
                type: VarDesc,
                filter: [{
                    name: 'name',
                    value: name,
                }],
            }, false);

            if (otherRefs.length > 0) {
                return;
            }

            registry.add({
                element: new VarDesc({ name }),
                refresh: refreshHandler,
                liveTime,
            });
        });

        version += 1;
        lastChanged = now;
    });
}
