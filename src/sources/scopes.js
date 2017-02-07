'use babel';

import {add as addToRegistry} from '../registry';
import {ScopeDesc} from '../desc-classes';

const scopes = [
    new ScopeDesc({
        name: 'application',
        description: ''
    }),
    new ScopeDesc({
        name: 'page',
        description: ''
    }),
    new ScopeDesc({
        name: 'request',
        description: ''
    }),
    new ScopeDesc({
        name: 'session',
        description: ''
    }),
];

export function register() {
    scopes.forEach(element => addToRegistry({element}));
}
