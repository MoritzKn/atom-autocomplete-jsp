# JSP Autocomplete package
[![Build Status](https://travis-ci.org/MoritzKn/atom-autocomplete-jsp.svg?branch=master)](https://travis-ci.org/MoritzKn/atom-autocomplete-jsp)

This [Atom](https://atom.io) package adds autocompletion support for JSP with focus on it's subset JSPX.  Uses the [autocomplete-plus](https://github.com/atom-community/autocomplete-plus) package.

See [setup][setup] and [changelog][changelog].

## Features
### Autocompletion for implicit objects
![Screenshot of autocompletion for implicit objects][screenshot-implicit-objects]

### Autocompletion for EL keywords
![Screenshot of autocompletion for keywords][screenshot-keywords]

### Autocompletion for variables defined in tags
![Screenshot of autocompletion for variables][screenshot-tags-set]

### Autocompletion for variables from `<jsp:useBean>` tags
![Screenshot of autocompletion for variables][screenshot-tags-use-bean]

### Autocompletion of tag functions from `.tld` files
![Screenshot of autocompletion for el-functions][screenshot-tag-functions]

See [setup][setup] for an explanation how to get autocompletion based on `.tld` files to work.

### Abbreviations
![Autocompletion for abbreviations][screenshot-abbreviations]

### Autocompletion for tags from `.tld` files
![Autocompletion for tag][screenshot-tag]

### Autocompletion for attributes from `.tld` files
![Autocompletion for tag attributes][screenshot-tag-attributes]

### Autocompletion for attributes values (`scope`, `var`)
![Autocompletion for var attribute][screenshot-var-attribute]
![Autocompletion for scope attribute][screenshot-scope-attribute]

### Follows include directives to find taglib declarations
To find all taglib declarations the package crawls the file system by following include directives.

## Goals
- EL autocompletion for properties

## What this package won't do
- Autocomplete embedded Java code

## Config
- `tldSources`: array of directories containing tld files

## Setup
* Install this package
```sh
apm install autocomplete-jsp
```

* Set the configuration `autocomplete-jsp.tldSources` to a directory of your choice, for example `~/tlds` and make sure this directory exist.
```sh
mkdir ~/tlds
```

* Make sure all [JSTL][jstl] TLDs are in this directory
```sh
cd ~/tlds
wget https://svn.java.net/svn/jstl~svn/tags/jstl-1.2/impl/src/main/resources/META-INF/fn.tld
wget https://svn.java.net/svn/jstl~svn/tags/jstl-1.2/impl/src/main/resources/META-INF/c.tld
wget https://svn.java.net/svn/jstl~svn/tags/jstl-1.2/impl/src/main/resources/META-INF/fmt.tld
wget https://svn.java.net/svn/jstl~svn/tags/jstl-1.2/impl/src/main/resources/META-INF/sql.tld
wget https://svn.java.net/svn/jstl~svn/tags/jstl-1.2/impl/src/main/resources/META-INF/x.tld
```

* Copy all of your custom `.tld` files into this directory
```sh
cp ~/workspace/someProject/src/main/resources/WEB-INF/*.tld ~/tlds
# or perhaps even
cp ~/workspace/*/src/**.tld ~/tlds/
```

## License
This project is licensed under the terms of the MIT license. A copy of the license can be found
in the root directory of the project in the file [LICENSE.md](./LICENSE.md).

[setup]: https://github.com/MoritzKn/atom-autocomplete-jsp/blob/master/README.md#setup
[changelog]: https://github.com/MoritzKn/atom-autocomplete-jsp/blob/master/CHANGELOG.md
[jstl]: https://jstl.java.net/

[screenshot-implicit-objects]: https://raw.githubusercontent.com/MoritzKn/atom-autocomplete-jsp/master/doc/img/screenshot-implicit-objects.png
[screenshot-keywords]:         https://raw.githubusercontent.com/MoritzKn/atom-autocomplete-jsp/master/doc/img/screenshot-keywords.png
[screenshot-tags-set]:         https://raw.githubusercontent.com/MoritzKn/atom-autocomplete-jsp/master/doc/img/screenshot-tags-set.png
[screenshot-tags-use-bean]:    https://raw.githubusercontent.com/MoritzKn/atom-autocomplete-jsp/master/doc/img/screenshot-tags-use-bean.png
[screenshot-tag-functions]:    https://raw.githubusercontent.com/MoritzKn/atom-autocomplete-jsp/master/doc/img/screenshot-tag-functions.png
[screenshot-abbreviations]:    https://raw.githubusercontent.com/MoritzKn/atom-autocomplete-jsp/master/doc/img/screenshot-abbreviations.png
[screenshot-tag]:              https://raw.githubusercontent.com/MoritzKn/atom-autocomplete-jsp/master/doc/img/screenshot-tag.png
[screenshot-tag-attributes]:   https://raw.githubusercontent.com/MoritzKn/atom-autocomplete-jsp/master/doc/img/screenshot-tag-attributes.png
[screenshot-var-attribute]:    https://raw.githubusercontent.com/MoritzKn/atom-autocomplete-jsp/master/doc/img/screenshot-var-attribute.png
[screenshot-scope-attribute]:  https://raw.githubusercontent.com/MoritzKn/atom-autocomplete-jsp/master/doc/img/screenshot-scope-attribute.png
