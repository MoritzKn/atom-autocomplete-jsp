'use babel';

import elProvider from './elProvider';
import tagProvider from './tagProvider';

export const activate = () => {
    elProvider.loadData();
    tagProvider.loadData();
};

export const getProviders = () => [elProvider, tagProvider];
