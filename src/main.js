'use babel';

import elProvider from './el-provider';
import tagProvider from './tag-provider';

import {register as registerIo} from './sources/implicit-object';
import {register as registerKw} from './sources/keywords';
import {register as registerScopes} from './sources/scopes';
import {register as registerTags} from './sources/tags';
import {register as registerTlds} from './sources/tlds';

export function activate() {
    registerIo();
    registerKw();
    registerTlds();
    registerTags();
    registerScopes();
}

export function getProviders() {
    return [elProvider, tagProvider];
}
