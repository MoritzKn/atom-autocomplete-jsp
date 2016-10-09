'use babel';

import elProvider from './elProvider';
import tagProvider from './tagProvider';

import {register as registerIo} from './sources/implicitObject';
import {register as registerKw} from './sources/keywords';
import {register as registerTlds} from './sources/tlds';
import {register as registerTags} from './sources/tags';

export const activate = () => {
    registerIo();
    registerKw();
    registerTlds();
    registerTags();
};

export const getProviders = () => [elProvider, tagProvider];
