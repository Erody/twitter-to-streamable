const Twitter = require('twitter');
const { getHighestKeyValue } = require('../helpers');

const twitter = new Twitter({
	consumer_key: process.env.TWITTER_CONSUMER_KEY,
	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

exports.getVideoUrl = async (url) => {
	const id = getTweetId(url);
	const tweet = await twitter.get(`statuses/show/${id}`, {}); // not passing empty object returns an error
	// extended_entities only exists on tweets that contain videos
	if(tweet.extended_entities) {
		const media = tweet.extended_entities.media;
		let url;
		media.forEach(item => {
			if(item.type === 'video') {
				const highestBitrate = getHighestKeyValue(item.video_info.variants, 'bitrate');
				url = highestBitrate.url;
			}
		});
		return url;
	}
	/*
	 returns undefined if tweet contains no extended_entities
	 doesn't mean that it contains no video, just that it isn't accessible
	 */
};

function getTweetId (url) {
	const regexp = new RegExp(/(status\/)(\d*)/i)
	const match = url.match(regexp);
	if(match) {
		return match[2];
	}
}
