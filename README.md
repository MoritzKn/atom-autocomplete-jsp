# Atom autocomplete+ provider for JSP
[![Build Status](https://travis-ci.org/MoritzKn/atom-autocomplete-jsp.svg?branch=master)](https://travis-ci.org/MoritzKn/atom-autocomplete-jsp)


This [Atom](https://atom.io) package adds autocompletion support for JSP with focus on it's subset JSPX.

**Warning:**
This package is in a very early stage.

![Screenshot of Atom with autocomplete-jsp][screenshot]

## Features
- EL autocompletion for implicit objects
- EL autocompletion based on `.tld` files
- EL autocompletion for varibles defined in tags such as `<c:set var"foo" value="bar"/>`

## Goals
- Tag autocompletion based on `.tld` files
- EL autocompletion for imported beans

## What this package won't do
- Autocomplete embedded Java code

## Config
- `tldSources`: array of directories containing tld files


[screenshot]: https://raw.githubusercontent.com/MoritzKn/atom-autocomplete-jsp/master/doc/img/screenshot-minimal.png
