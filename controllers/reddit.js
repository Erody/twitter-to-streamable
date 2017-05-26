const AsyncPolling = require('async-polling');
const Snoowrap = require('snoowrap');
const { getVideoUrl } = require('./twitter');
const { uploadToStreamable } = require('./streamable');
const { createComment } = require('../helpers/comment');

const reddit = new Snoowrap({
	userAgent: 'TwitterToStreamable 2.0.0 - convert twitter videos to streamable',
	clientId: process.env.REDDIT_KEY,
	clientSecret: process.env.REDDIT_SECRET,
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASS
});

let oldRes = [];
async function getNewSubmissions(end) {
	// new submissions on all subreddits (test /r/all, otherwise just take a list of popular ones)
	// check which submissions are new
		// save submissions on each request
		// check which submissions weren't in the previous request
		// only send new submissions to end()
	reddit
		.getSubreddit('testingMyBotsAndStuff')
		// .getSubreddit('all')
		.getNew()
		.then(res => {
			console.log(res.length);
			const newRes = difference(oldRes, res, 'name');
			end(null, newRes);
			oldRes = res;
		})
		.catch(err => {
			end(err);
		})
}

// takes 2 arrays of objects and the property to check difference by
// returns all objects from the new object that aren't in the old object.
function difference(oldObj, newObj, property) {
	const names = oldObj.map(obj => obj[property]);
	return newObj.filter(obj => {
		return !names.includes(obj[property]);
	})
}

async function handleTwitter(tweetUrl, id, title, name) {
	// get videoUrl from tweetUrl
	const videoUrl = await getVideoUrl(tweetUrl);
	// check if tweet contained video url
	if(videoUrl){
		console.log(videoUrl);
		// upload video to streamable
		const streamableUrl = await uploadToStreamable(videoUrl);
		console.log(streamableUrl);
		// on succesful upload
		if(streamableUrl) {
			// post comment on reddit with streamable url
			await postComment(streamableUrl, id, title, name);
			console.log('Comment posted');
			// add comment to database
		}
	}
}

function postComment(streamableUrl, id, title, name) {
	const comment = createComment(streamableUrl, id, title, name);
	reddit
		.getSubmission(id)
		.reply(comment)
		.catch(err => console.error(err))
}

const polling = AsyncPolling(getNewSubmissions, 5000);

polling.on('run', () => console.log('Bot is now running...'));
polling.on('start', () => console.log('Polling...'));
polling.on('error', err => console.error(err));
polling.on('result', res => {
	res.forEach(item => {
		const {id, name, over_18, domain, url, title, subreddit_name_prefixed } = item;
		if(over_18) return;
		switch(domain) {
			case 'twitter.com':
				// handle twitter
				handleTwitter(url, id, title, name);
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