const request = require('request-promise-native');



exports.uploadToStreamable = async (videoUrl) => {
	const url = `https://api.streamable.com/import?url=${videoUrl}`;
	try {
		const resString =  await request.get(url); // shitty ass api returns a string instead of json...
		const res = JSON.parse(resString);
		if(res.status !== 1) return;
		return `https://streamable.com/${res.shortcode}`
	} catch (err) {
		console.error(`[Streamable Error] ${err.message}`);
	}
};