const fs = require('fs');
const path = require('path');

class BizVersionPlugin {
	constructor(options = {}) {
		this.options = options;
		this.script = '';
	}

	apply(compiler) {
		this.compiler = compiler;

		this.mergeOptions(compiler);

		const done = (compilation, callback) => {
			callback = callback || (() => {});
			this.compilation = compilation;

			const actions = [];

			actions.push(() => this.inputVersion());

			actions.push(() => this.outputVersion());

			actions.push(() => this.outputApis());

			actions.push(() => this.insertApis());

			if (actions.length) {
				// Making analyzer logs to be after all webpack logs in the console
				setImmediate(async () => {
					try {
						await Promise.all(actions.map(action => action()));
						callback();
					} catch (e) {
						callback(e);
					}
				});
			} else {
				callback();
			}
		};

		if (compiler.hooks) {
			compiler.hooks.emit.tap('bizVersion', done);
		} else {
			compiler.plugin('emit', done);
		}
	}

	mergeOptions(compiler) {
		const defaultOptions = {
			mode: 'silent',
			input: {
				path: compiler.options.context,
				name: 'package.json'
			},
			output: {
				path: compiler.options.output.path,
				name: 'biz-version.json'
			},
			scope: '$BizVersion'
		};
		this.options = Object.assign({}, defaultOptions, this.options);
	}

	inputVersion() {
		return new Promise((resolve, reject) => {
			try {
				let inputPath = path.resolve(this.options.input.path, this.options.input.name);
				let {version} = this.readJson(inputPath);
				console.log('[BizVersionPlugin] Get version from package.json: ', version);
				this.version = version;
				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}

	outputVersion() {
		return new Promise((resolve, reject) => {
			try {
				let outputPath = path.resolve(this.options.output.path, this.options.output.name);
				let outputJson = `{\n\t"version": "${this.version}"\n}`;
				this.writeJson(outputPath, outputJson);
				console.log('[BizVersionPlugin] Write version to ', outputPath);
				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}

	outputApis() {
		let mode = this.options.mode.toLowerCase() || 'alert';

		let apis = {
			state: `OK:${mode}`
		};
		const build = require('./biz-apis');
		apis.check = (context) => build()[mode](context);

		this.script = `
			<script type="text/javascript">
				((global) => {
					global['$BizVersionTimestamp'] = '${new Date()}';
					global['$BizVersionContext'] = '${JSON.stringify(this.options)}';
					global['${this.options.scope}'] = {
						state: '${apis.state}',
						check: ${apis.check()}
					};
				})(window);
			</script>
		`;
	}

	insertApis() {
		return new Promise((resolve, reject) => {
			try {
				const htmlFiles = [];
				const htmlNameReg = /^.*\.html/gim;
				const insertPlaceReg = /(.*)(\<body\>.*)/gim;
				Object.keys(this.compilation.assets).forEach((item) => {
					if (htmlNameReg.test(item)) {
						htmlFiles.push(item);
					}
				});
				console.log('html files: ', htmlFiles);
				htmlFiles.forEach(htmlFile => {
					let htmlStr = this.compilation.assets[htmlFile].source();
					htmlStr = htmlStr.replace(insertPlaceReg, `$1${this.script}$2`);

					this.compilation.assets[htmlFile] = {
						source: () => htmlStr,
						size: () => htmlStr.length
					};
				});
				resolve();
			} catch (e) {
				reject(e);
			}
		});
	}

	readJson(filePath) {
		let str = fs.readFileSync(filePath, {encoding: 'utf-8'}) || '{}';
		return JSON.parse(str);
	}

	writeJson(filePath, data) {
		fs.writeFileSync(filePath, data, {flag: 'w+'});
	}
}

module.exports = BizVersionPlugin;
