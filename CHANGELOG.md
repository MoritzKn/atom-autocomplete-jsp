# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## 1.0.0 - 2017-02-10
### Added
- Completion for tags, attributes and attribute values
- Specs for tag, attribute and attribute value completion

### Fixed
- Problem with new lines in method signatures from `.tld` files

### Changed
- Favor variables from `<c:useBean>` tags over vars from `<c:set>` tags

## 0.4.1 - 2016-12-24
### Changed
- README

## 0.4.0 - 2016-12-24
### Changed
- Only show autocompletion from imported taglibs. Taglibs can be imported with:
    - The taglib directive (`<%@ taglib uri="uri" prefix="tagPrefix" >`)
    - The XML equivalent of the taglib directive (`<jsp:directive.taglib uri="uri" prefix="tagPrefix" />`)
    - As XML namespace (`<jsp:root xmlns:tagPrefix="uri">`)

### Fixed
- Use dynamic prefix for EL-Functions. Previously the `short-name` from the taglib was used, now the prefix from the taglib directive is used.

## 0.3.3 - 2016-12-16
### Changed
- Only show autocompletion if the prefix is longer or equal then the
  `autocomplete-plus.minimumWordLength` configuration or the autocompletion was triggered
  by `autocomplete-plus:activate` (<kbd>Ctrl-Space</kbd>)

### Added
- A label with the full name for keyword e.g. `less or equal` for `eq`
- Specs for the EL-provider

## 0.3.2 - 2016-12-8
No changes

## 0.3.1 - 2016-12-8
### Fixed
- Bug with the recognition of variables defined in tags

## 0.3.0 - 2016-12-02
### Added
- Autocompletion for references to objects imported by `<jsp:useBean>` tags

## 0.2.2 - 2016-12-01
### Added
- Screenshots

## 0.2.1 - 2016-12-01
### Changed
- The TLD files are now loaded completely async

### Fixed
- Problems with mixed case EL functions
- Bug when loading TLDs from a folder that contained other files as well
- Bug with underscores in package or class names

## 0.2.0 - 2016-10-09
### Added
- Mechanism to load TLFs from a directories specified by the configuration
- Autocompletion for variables defined in tags such as `<c:set var"foo" value="bar"/>`

## 0.1.0 - 2016-10-07
### Added
- Basic autocompletion for tag functions
- Autocompletion for implicit objects
