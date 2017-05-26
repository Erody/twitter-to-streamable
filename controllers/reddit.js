const AsyncPolling = require('async-polling');
const Snoowrap = require('snoowrap');
const { getVideoUrl } = require('./twitter');
const request = require('request-promise-native');

const reddit = new Snoowrap({
	userAgent: 'TwitterToStreamable 2.0.0 - convert twitter videos to streamable',
	clientId: process.env.REDDIT_KEY,
	clientSecret: process.env.REDDIT_SECRET,
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASS
});

function getNewSubmissions(end) {
	// new submissions on all subreddits (test /r/all, otherwise just take a list of popular ones)
	// check which submissions are new
		// save submissions on each request
		// check which submissions weren't in the previous request
		// only send new submissions to end()
	reddit
		.getSubreddit('testingMyBotsAndStuff')
		.getNew()
		.then(res => {
			end(null, res);
		})
		.catch(err => {
			end(err);
		})
}

async function handleTwitter(tweetUrl) {
	// get videoUrl from tweetUrl
	const videoUrl = await getVideoUrl(tweetUrl);
	// check if tweet contained video url
	if(videoUrl){
		console.log(videoUrl);
		// upload video to streamable
		const streamableUrl = await uploadToStreamable(videoUrl);
		// on succesful upload
		if(streamableUrl) {
			// post comment on reddit with streamable url
			
		}
	}
}

async function uploadToStreamable(videoUrl) {
	const url = `https://api.streamable.com/import?url=${videoUrl}`;
	const res =  await request.get(url);
	if(res.status !== 1) return;
	return `https://streamable.com/${res.shortcode}`
}

const polling = AsyncPolling(getNewSubmissions, 5000);

polling.on('start', () => console.log('Polling started...'));
polling.on('error', err => console.error(err));
polling.on('result', res => {
	res.forEach(item => {
		const {id, name, over_18, domain, url, title, subreddit_name_prefixed } = item;
		if(over_18) return;
		switch(domain) {
			case 'twitter.com':
				// handle twitter
				handleTwitter(url);
				break;
			case 'my.mixtape.moe':
				// handle mixtape
				break;
			case 'nya.is':
				// handle nya
				break;
			default:
				// handle default
		}
		console.log(`[${subreddit_name_prefixed}] ${title}`)
	})
});
polling.run();

module.exports = reddit;