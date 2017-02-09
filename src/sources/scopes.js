'use babel';

import {add as addToRegistry} from '../registry';
import {ScopeDesc} from '../desc-classes';

const scopes = [
    new ScopeDesc({
        name: 'application',
    }),
    new ScopeDesc({
        name: 'page',
    }),
    new ScopeDesc({
        name: 'request',
    }),
    new ScopeDesc({
        name: 'session',
    }),
];

export function register() {
    scopes.forEach(element => addToRegistry({element}));
}
