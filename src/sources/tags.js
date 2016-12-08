'use babel';

import * as registry from '../registry';
import {VarDesc} from '../dataClasses';
import {shortType} from '../utils';

const varRegExp = /<[a-zA-Z][a-zA-Z0-3_]*:[a-zA-Z][a-zA-Z0-3_]+\s+[^>]*var="([^"]*)"[^>]*>/g;
const useBeanRegExp = /<jsp:useBean\s+[^>]*((?:class|id)="[^"]*")\s+[^>]*((?:class|id)="[^"]*"\s*)[^>]*\/?\>/g;

const liveTime = 800;

let version = 0;
let lastChanged = new Date();

export function register() {
    registry.on('refresh', () => {

        const now = new Date();
        if (lastChanged.getTime() + liveTime > now.getTime()) {
            return;
        }

        let localVersion = version;
        const editorText = atom.workspace.getActiveTextEditor().getText();

        const refreshFn = function() {
            if (version > localVersion) {
                this.remove();
            } else {
                return this.content;
            }
        };

        // Use replace because it's the only way to get all matches and all groups
        editorText.replace(varRegExp, (match, varName) => {
            const otherRefs = registry.getAll({ type: VarDesc, name: varName }, false);

            if (otherRefs.length > 0) {
                return;
            }

            registry.add({
                element: new VarDesc({ name: varName }),
                refresh: refreshFn,
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
                    type: shortType(classValue),
                    name: idValue
                }),
                refresh: refreshFn,
            });
        });

        version += 1;
        lastChanged = now;
    });
}
