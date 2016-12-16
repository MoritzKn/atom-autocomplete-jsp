'use babel';

export default {
    selector: '.text.html.jsp',
    disableForSelector: '.source.java, .el_expression, .comment',
    inclusionPriority: 50,
    excludeLowerPriority: false, // include html tags etc

    getSuggestions: () => {
        return [];
    }
};
