const AsyncPolling = require('async-polling');
const Snoowrap = require('snoowrap');
const { getVideoUrl } = require('./twitter');
const {uploadToStreamable } = require('./streamable');
const { createComment } = require('../helpers/comment');
const mongoose = require('mongoose');
const Comment = mongoose.model('Comment');
const Submission = mongoose.model('Submission');

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

async function handleTwitter(item) {
	// get videoUrl from tweetUrl
	const videoUrl = await getVideoUrl(item.url);
	// check if tweet contained video url
	if(videoUrl){
		// upload video to streamable
		let streamableUrl = await uploadToStreamable(videoUrl);
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

function saveMetadata (comment, item) {
	const { name, title, subreddit, created_utc, permalink, ups } = item;
	const submission = new Submission({
		name,
		title,
		subreddit: subreddit.display_name,
		upvotes: ups,
		created: new Date(created_utc * 1000),
		permalink
	});
	comment.submission = submission;
	comment
		.save()
		.catch(err => console.error(err));
	submission
		.save()
		.catch(err => console.error(err));
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

const polling = AsyncPolling(getNewSubmissions, 5000);

polling.on('run', () => console.log('Bot is now running...'));
polling.on('start', () => console.log('Polling...'));
polling.on('error', err => console.error(err));
polling.on('result', res => {
	res.forEach(item => {
		const {over_18, domain, title, subreddit_name_prefixed } = item;
		if(over_18) return;
		console.log(domain);
		switch(domain) {
			case 'twitter.com':
				// handle twitter
				handleTwitter(item);
				break;
			case 'my.mixtape.moe':
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