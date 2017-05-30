const request = require('request-promise-native');



exports.uploadToStreamable = async (videoUrl) => {
	const url = `https://api.streamable.com/import?url=${videoUrl}`;
	try {
		const resString =  await request.get(url); // shitty ass api returns a string instead of json...
		const res = JSON.parse(resString);
		if(res.status !== 1) return;
		console.log(`Uploaded to streamable: ${res.shortcode}`);
		return `https://streamable.com/${res.shortcode}`
	} catch (err) {
		console.error(`[Streamable Error] ${err.message}`);
		console.log('retrying');
		return await retry(this.uploadToStreamable, videoUrl, 5000);
	}
};

function retry(fnc, param, timeout) {
	return new Promise((resolve, reject) => {
		setTimeout(async () => {
			try {
				const result = await fnc(param);
				resolve(result);
			} catch(err) {
				reject(err);
			}

		}, timeout)
	})
}