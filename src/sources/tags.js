'use babel';

import * as registry from '../registry';
import {VarDesc} from '../desc-classes';

const varRegExp = /<[a-zA-Z][a-zA-Z0-3_]*:[a-zA-Z][a-zA-Z0-3_]+\s+[^>]*var="([^"]*)"[^>]*>/g;
const useBeanRegExp = /<jsp:useBean\s+[^>]*((?:class|id)="[^"]*")\s+[^>]*((?:class|id)="[^"]*"\s*)[^>]*\/?>/g;

/**
 * The live time of the detected elements i.e. the refresh rate
 * @type {Number}
 */
const liveTime = 800;

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

        // Use replace because it's the only way to get all matches and all groups
        editorText.replace(varRegExp, (match, name) => {
            const otherRefs = registry.getAll({ type: VarDesc, name }, false);

            if (otherRefs.length > 0) {
                return;
            }

            registry.add({
                element: new VarDesc({ name }),
                refresh: refreshHandler,
                liveTime,
            });
        });

        editorText.replace(useBeanRegExp, (match, firstAttr, secondAttr) => {
            const classRegExp = /class="([^"]*)"/;
            const idRegExp = /id="([^"]*)"/;

            let idMatch = firstAttr.match(idRegExp);
            let classMatch = secondAttr.match(classRegExp);
            if (!idMatch) {
                idMatch = secondAttr.match(idRegExp);
            }
            if (!classMatch) {
                classMatch = firstAttr.match(classRegExp);
            }

            const classValue = classMatch[1];
            const idValue = idMatch[1];

            const otherRefs = registry.getAll({ type: VarDesc, name: idValue }, false);

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

        version += 1;
        lastChanged = now;
    });
}
