# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## Unreleased
## Changed
- Only show autocompleteion if the prefix is longer or equal then the
  `autocomplete-plus.minimumWordLength` configuration or autocompleteion is triggert with
  `autocomplete-plus:activate` (<kbd>Ctrl-Space</kbd>)

## Added
- A lable with the fullname for keyword e.g. `less or equal` for `eq`
- Specs for the EL-provider

## 0.3.2 - 2016-13-8
No changes

## 0.3.1 - 2016-13-8
### Fixed
- Bug with the recognition of varibles defined in tags

## 0.3.0 - 2016-12-02
### Added
- Autocompletion for references to objects imported by `<jsp:useBean>` tags

## 0.2.2 - 2016-12-01
### Added
- Screenshots

## 0.2.1 - 2016-12-01
### Changed
- TLD files are now loaded completely async

### Fixed
- Problems with mixed case EL functions
- Bug when loading TLDs from a folder that contained other files as well
- Bug with underscores in package or class names

## 0.2.0 - 2016-10-09
### Added
- Mechanism to load tlds from a directories specified in the config
- Autocompletion for varibles defined in tags such as `<c:set var"foo" value="bar"/>`

## 0.1.0 - 2016-10-07
### Added
- Basic autocompletion for tag functions
- Autocompletion for implicit objects
