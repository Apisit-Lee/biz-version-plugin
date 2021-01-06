module.exports = function builder() {
	function silent() {
		return (localVersion) => {
			console.log('localVersion:', localVersion);
			let context = JSON.parse(window.$BizVersionContext);
			let {
				output: {
					name: outputName
				} = {}
			} = context || {};
			let filePath = `./${outputName}?t=${new Date().getTime()}`;
			fetch(filePath).then(json => json.json()).then(res => {
				console.log('fetch then:', res);
				let {version} = res || {};
				if (version && version !== localVersion) {
					window.location.reload();
				}
			}).catch(res => {
				console.log('fetch catch:', res);
			});
		}
	}
	function alert() {
		return (callback) => {
			let context = JSON.parse(window.$BizVersionContext);
			let {
				output: {
					name: outputName
				} = {}
			} = context || {};
			let filePath = `./${outputName}?t=${new Date().getTime()}`;
			fetch(filePath).then(json => json.json()).then(res => {
				console.log('fetch then:', res);
				let {version} = res || {};
				if (version) {
					if (callback) {
						callback(version);
					}
				}
			}).catch(res => {
				console.log('fetch catch:', res);
			});
		}
	}
	return {
		silent,
		alert
	};
};
