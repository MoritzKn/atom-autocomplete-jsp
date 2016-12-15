'use babel';

import elProvider from './elProvider';
import tagProvider from './tagProvider';

import {register as registerIo} from './sources/implicitObject';
import {register as registerKw} from './sources/keywords';
import {register as registerTags} from './sources/tags';
import {register as registerTlds} from './sources/tlds';

export function activate() {
    registerIo();
    registerKw();
    registerTlds();
    registerTags();
}

export function getProviders() {
    return [elProvider, tagProvider];
}
