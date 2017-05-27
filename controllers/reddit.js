const AsyncPolling = require('async-polling');
const Snoowrap = require('snoowrap');
const { getVideoUrl } = require('./twitter');
const {uploadToStreamable } = require('./streamable');
const { createComment, saveMetadata } = require('../helpers');
const mongoose = require('mongoose');
const Comment = mongoose.model('Comment');

const reddit = new Snoowrap({
	userAgent: 'TwitterToStreamable 2.0.0 - poll subreddits',
	clientId: process.env.REDDIT_KEY,
	clientSecret: process.env.REDDIT_SECRET,
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASS
});
reddit.config({
	continueAfterRatelimitError: true,
});

let oldRes = [];
async function getNewSubmissions(end) {
	reddit
		// new submissions on all subreddits (test /r/all, otherwise just take a list of popular ones)
		.getSubreddit('testingMyBotsAndStuff')
		// .getSubreddit('all')
		.getNew()
		.then(res => {
			// check which submissions are new
			const newRes = difference(oldRes, res, 'name');
			// only send new submissions to end()
			end(null, newRes);
			// save old response to check against
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

async function handleTwitter(item) {
	// get videoUrl from tweetUrl
	const videoUrl = await getVideoUrl(item.url);
	// check if tweet contained video url
	if(videoUrl){
		// upload video to streamable
		let streamableUrl = await uploadToStreamable(item.url);
		// on succesful upload
		if(streamableUrl) {
			// post comment on reddit with streamable url
			const comment = await postComment(streamableUrl, item);
			console.log(`Comment posted - ${comment.name}`);
			// save submission and comment to database
			saveMetadata(comment, item);
		}
	}
}

async function handleLinkInUrl(item) {
	// check if link is video
	if(item.url.endsWith('.mp4')) {
		// upload video to streamable
		let streamableUrl = await uploadToStreamable(item.url);
		// on succesful upload
		if(streamableUrl) {
			// post comment on reddit with streamable url
			const comment = await postComment(streamableUrl, item);
			console.log(`Comment posted - ${comment.name}`);
			// save submission and comment to database
			saveMetadata(comment, item);
		}
	}
}

async function postComment(streamableUrl, item) {
	const { id } = item;
	const commentText = createComment(streamableUrl, item);
	const comment = await reddit.getSubmission(id).reply(commentText);
	const { name, ups } = comment;
	return new Comment({
		name,
		upvotes: ups
	});
}

const polling = AsyncPolling(getNewSubmissions, 10000);

polling.on('run', () => console.log('Bot is now running...'));
polling.on('start', () => console.log('Polling...'));
polling.on('error', err => console.error(err));
polling.on('result', res => {
	res.forEach(item => {
		const {over_18, domain, title, subreddit_name_prefixed } = item;
		if(over_18) return;
		switch(domain) {
			case 'twitter.com':
				// handle twitter
				handleTwitter(item);
				break;
			case 'my.mixtape.moe':
				// handle mixtape
				handleLinkInUrl(item);
				break;
			case 'track5.mixtape.moe':
				// handle mixtape
				handleLinkInUrl(item);
				break;
			case 'track4.mixtape.moe':
				// handle mixtape
				handleLinkInUrl(item);
				break;
			case 'u.nya.is':
				// handle nya
				handleLinkInUrl(item);
				break;
			default:
				// handle default
		}
		// console.log(`[${subreddit_name_prefixed}] ${title}`)
	})
});
polling.run();

module.exports = reddit;