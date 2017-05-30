const AsyncPolling = require('async-polling');
const Snoowrap = require('snoowrap');
const URI = require('uri-js');
const { getVideoUrl } = require('./twitter');
const {uploadToStreamable } = require('./streamable');
const { createComment, saveMetadata, difference } = require('../helpers');
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
	requestDelay: 2000,
	continueAfterRatelimitError: true,
});

let oldRes = [];
async function getNewSubmissions(end) {
	reddit
		// new submissions on all subreddits (test /r/all, otherwise just take a list of popular ones)
		// .getSubreddit('testingMyBotsAndStuff')
		.getSubreddit('all')
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

async function handleTwitter(item) {
	// get videoUrl from tweetUrl
	const videoUrl = await getVideoUrl(item.url);
	// check if tweet contained video url
	if(videoUrl){
		// upload video to streamable
		const streamableUrl = await uploadToStreamable(item.url);
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
		const streamableUrl = await uploadToStreamable(item.url);
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
	const commentText = createComment(streamableUrl, item);
	const comment = await item.reply(commentText);
	const { name, ups } = comment;
	return new Comment({
		name,
		upvotes: ups
	});
}

function getMessages(end) {
	reddit
		.getInbox({filter: 'unread'})
		.then(messages => end(null, messages))
		.catch(err => end(err));
}

async function handleNewMessage(item) {
	const { body, name } = item;
	const urls = getUrlsFromMessageBody(body);
	if(!urls.length) return;
	urls.forEach(async (url) => {
		const components = URI.parse(url);
		const domain = components.host;
		if(domain === 'twitter.com') {
			const videoUrl = await getVideoUrl(url);
			if(videoUrl) {
				const streamableUrl = await uploadToStreamable(videoUrl);
				await postComment(streamableUrl, item);
				item.markAsRead();
				console.log(`Replied - ${item.name}`);
			}
		} else if(domain === 'my.mixtape.moe' || domain === 'u.nya.is') {
			const streamableUrl = await uploadToStreamable(url);
			await postComment(streamableUrl, item);
			item.markAsRead();
			console.log(`Replied - ${item.name}`);
		}
	});
}

function getUrlsFromMessageBody(body) {
	// search for url
	const regex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;
	return body.match(regex);
}

const submissionPolling = AsyncPolling(getNewSubmissions, 3000); // 2 seconds
const messagePolling = AsyncPolling(getMessages, 120000); // 2 minutes

submissionPolling.on('run', () => console.log('Submission polling is running...'));
// submissionPolling.on('start', () => console.log('Polling submissions...'));
submissionPolling.on('error', err => console.error(err));
submissionPolling.on('result', res => {
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

messagePolling.on('run', () => console.log('Message polling is running...'));
// messagePolling.on('start', () => console.log('Polling messages...'));
messagePolling.on('error', err => console.error(err));
messagePolling.on('result', res => {
	res.forEach(item => {
		handleNewMessage(item);
	});
});


messagePolling.run();
submissionPolling.run();

module.exports = reddit;