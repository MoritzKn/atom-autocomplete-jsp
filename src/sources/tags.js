'use babel';

import {mkSimpleSuggestionFilter} from '../utils';

export const getVaribles = ({editor, prefix}) => {

    const filter = mkSimpleSuggestionFilter(prefix);
    const type = 'variable';

    const varRegExp = /<[a-zA-Z]+:[a-zA-Z]+\s+[^>]*var="([^"]*)"[^>]*>/g;

    let varibles = [];

    editor.getText().replace(varRegExp, (match, varName) => {
        varibles.push(varName);
    });

    return varibles
        .filter(filter)
        .map(name => ({
            text: name,
            type: type,
        }));
};
