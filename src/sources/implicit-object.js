'use babel';

import {add as addToRegistry} from '../registry';
import {VarDesc} from '../desc-classes';

const implicitObjects = [
    new VarDesc({
        name: 'pageContext',
        type: 'PageContext',
        description: 'The context for the JSP page.',
    }),
    new VarDesc({
        name: 'param',
        type: 'Map',
        description: 'Maps a request parameter name to a single value.',
    }),
    new VarDesc({
        name: 'paramValues',
        type: 'Map',
        description: 'Maps a request parameter name to an array of values.',
    }),
    new VarDesc({
        name: 'header',
        type: 'Map',
        description: 'Maps a request header name to a single value.',
    }),
    new VarDesc({
        name: 'headerValues',
        type: 'Map',
        description: 'Maps a request header name to an array of values.',
    }),
    new VarDesc({
        name: 'cookie',
        type: 'Map',
        description: 'Maps a cookie name to a single cookie.',
    }),
    new VarDesc({
        name: 'initParam',
        type: 'Map',
        description: 'Maps a context initialization parameter name to a single value.',
    }),
    new VarDesc({
        name: 'pageScope',
        type: 'Map',
        description: 'Maps page-scoped variable names to their values.',
    }),
    new VarDesc({
        name: 'requestScope',
        type: 'Map',
        description: 'Maps request-scoped variable names to their values.',
    }),
    new VarDesc({
        name: 'sessionScope',
        type: 'Map',
        description: 'Maps session-scoped variable names to their values.',
    }),
    new VarDesc({
        name: 'applicationScope',
        type: 'Map',
        description: 'Maps application-scoped variable names to their values.',
    }),
];

export function register() {
    implicitObjects.forEach(element => addToRegistry({element}));
}
