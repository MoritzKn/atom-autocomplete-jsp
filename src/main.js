'use babel';

import elProvider from './elProvider';
import tagProvider from './tagProvider';

const packagePath = atom.packages.getPackageDirPaths() + '/autocomplete-jsp';

export const config = {
    tldSources: {
        type: 'array',
        default: [`${packagePath}/tlds`]
    },
};

export const activate = () => {
    elProvider.loadData();
    tagProvider.loadData();
};

export const getProviders = () => [elProvider, tagProvider];
