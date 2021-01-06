# Biz Version Plugin

[https://github.com/Apisit-Lee/biz-version-plugin](https://github.com/Apisit-Lee/biz-version-plugin)

BizVersionPlugin is a webpack plugin, witch provide an environment ignored version update flow based on version value in package.json.

It has no relation with bundle hash, but biz version only. So, when you change version value in package.json file and make a deployment, you may need an force reload to update front end cache.

## configuration

In webpack config file, you could just use default config like below:

```javascript
const BizVersionPlugin = require('biz-version-plugin');

module.exports = {
  plugins: [
    new BizVersionPlugin() 
  ]
};
```

Or you could pass config object to cover default.

### config options

- **mode**
    `silent` or `alert` mode. In silent mode, when versions are different, it will reload app automatically. In alert mode, version is provide to callback function, you need to compare versions manually.

- **input**
    `input.path`: path to json file. `input.name`: default is 'package.json'.
- **output**
    `output.path`: path to put biz-version.json. `output.name`: file name of biz-version.json.
- **scope**
    We will inset an object to window Object, you could set this object's name, default is `$BziVersion`.

## usage

We provide a `$BizVersion` Object by default, you can use its check function to handle version compare.

There are two modes: **silent** and **alert**.

In silent mode, you need to pass localVersion as param. When localVersion is not equal to version, it will reload automatically. e.g.

```javascript
// main.js
const localVersion = require('path/to/package.json').version;
$BizVersion.check(localVersion);
```

In alert mode, you need to pass a callback function as param. e.g.

```javascript
const localVersion = require('path/to/package.json').version;
$BizVersion.check((version) => {
  if (localVersion !== version) {
    window.location.reload();
  }
});
```
