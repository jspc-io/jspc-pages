jspc pages
==

Sources for https://jspc.me

![CircleCI status](https://circleci.com/gh/jspc-io/jspc-pages.png?circle-token=:circle-token)

Usage
--

This project is a very simple node app, controllable via gulp, that compiles a load of assets into static pages. It can be invoked, for development, as:

```bash
$ gulp --dev
```

Or to produce productionised code (so; concatanated assets, minification, etc., etc.):

```bash
$ gulp
```

Installation
--

You'll need ruby installed, and to bundle, for the sass linter:

```bash
$ gem install bundler
$ bundle
```

You'll then need to get node and asset dependencies:

```bash
$ npm install
$ bower install
```
