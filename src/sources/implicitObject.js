'use babel';

import {varDesc} from '../dataClasses';
import {mkSimpleSuggestionFilter} from '../utils';

const implicitObjects = [
     new varDesc({
        name: 'request',
        type: 'HttpServletRequest'
    }), new varDesc({
        name: 'response',
        type: 'HttpServletResponse'
    }), new varDesc({
        name: 'out',
        type: 'PrintWriter'
    }), new varDesc({
        name: 'session',
        type: 'HttpSession'
    }), new varDesc({
        name: 'application',
        type: 'ServletContext'
    }), new varDesc({
        name: 'config',
        type: 'ServletConfig'
    }), new varDesc({
        name: 'pageContext',
        type: 'PageContext'
    }), new varDesc({
        name: 'page',
        type: 'Object'
    }), new varDesc({
        name: 'exception',
        type: 'Throwable'
    }),
];

export const getImplicitElObjects = ({editor, prefix}) => {
    const filter = mkSimpleSuggestionFilter(prefix);
    const type = 'variable';

    return implicitObjects
        .filter(varDesc => filter(varDesc.name))
        .map(varDesc => ({
            text: varDesc.name,
            leftLabel: varDesc.type,
            type: type,
        }));
};
