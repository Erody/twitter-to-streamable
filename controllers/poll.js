const AsyncPolling = require('async-polling');
const Snoowrap = require('snoowrap');
const URI = require('uri-js');
const mongoose = require('mongoose');
const EventEmitter = require('events');
const Comment = mongoose.model('Comment');
const Parent = mongoose.model('Parent');
const { getVideoUrl } = require('./twitter');
const {uploadToStreamable } = require('./streamable');
const { difference, getUrlsFromString } = require('../helpers');

const reddit = new Snoowrap({
	userAgent: 'TwitterToStreamable 2.0.0 - poll subreddits',
	clientId: process.env.REDDIT_KEY,
	clientSecret: process.env.REDDIT_SECRET,
	username: process.env.REDDIT_USERNAME,
	password: process.env.REDDIT_PASS
});
reddit.config({
	requestDelay: 1500,
	continueAfterRatelimitError: true,
});

class RedditEvents extends EventEmitter {}
exports.redditEvents = new RedditEvents();

let oldRes = [];
function getNewSubmissions(end) {
	const subreddits = ['soccer', 'videos', 'liverpoolfc', 'all'];
	// const subreddits = ['soccer', 'videos', 'liverpoolfc'];
	// const subreddits = ['testingMyBotsAndStuff'];

	subreddits.forEach((subreddit, index) => {
		if(!oldRes[index]) {
			oldRes[index] = [];
		}
		reddit
			.getSubreddit(subreddit)
			.getNew()
			.then(res => {
				const newRes = difference(oldRes[index], res, 'name');
				end(null, newRes);
				oldRes[index] = res;
			})
			.catch(err => end(err));
	});

}

async function handleTwitter(item) {
	// get videoUrl from tweetUrl
	const videoUrl = await getVideoUrl(item.url);
	// check if tweet contained video url
	if(videoUrl){
		console.log('twitter link is video');
		// upload video to streamable
		const streamableUrls = [await uploadToStreamable(item.url)];
		// on succesful upload
		if(streamableUrls) {
			// post to database
			const parent = await newParent(item, streamableUrls);
			// emit newParent event
			exports.redditEvents.emit('newParent', streamableUrls, item, parent);
		}
	}
}

async function handleLinkInUrl(item) {
	console.log('Attempting to handle mixtape or nya link');
	// check if link is video
	if(item.url.endsWith('.mp4')) {
		console.log('Mixtape/nya link is video');
		// upload video to streamable
		const streamableUrls = [await uploadToStreamable(item.url)];
		// on succesful upload
		if(streamableUrls) {
			// post to database
			const parent = await newParent(item, streamableUrls);
			// emit newParent event
			exports.redditEvents.emit('newParent', streamableUrls, item, parent);
		}
	}
}

function getMessages(end) {
	reddit
		.getInbox({filter: 'unread'})
		.then(messages => end(null, messages))
		.catch(err => end(err));
}

async function handleNewMessage(item) {
	item.markAsRead();
	const { body } = item;
	const urls = getUrlsFromString(body);
	if(!urls || !urls.length) return;
	const streamableUrls = await createUrlsArray(urls);
	// post to database
	const parent = await newParent(item, streamableUrls);
	// emit newParent event
	exports.redditEvents.emit('newParent', streamableUrls, item, parent);

}

async function createUrlsArray(urls) {
	const streamableUrls = [];
	for(let url of urls) {
		const components = URI.parse(url);
		const domain = components.host;
		if(domain === 'twitter.com') {
			const videoUrl = await getVideoUrl(url);
			if(videoUrl) {
				const streamableUrl = await uploadToStreamable(videoUrl);
				streamableUrls.push(streamableUrl);
			}
		} else if(domain === 'my.mixtape.moe' || domain === 'u.nya.is') {
			const streamableUrl = await uploadToStreamable(url);
			streamableUrls.push(streamableUrl);
		}
	}
	return streamableUrls;
}

async function newParent(item, streamableUrls) {
	const {name, ups, created_utc} = item;
	const parent = await Parent.findOne({name});
	if(parent) return parent;

	const newParent = new Parent({
		created: new Date(created_utc * 1000),
		name,
		upvotes: ups,
		replied: false,
		streamableUrls
	});
	newParent
		.save()
		.then(() => console.log(`Submission, or message ${name} saved to the database`))
		.catch(err => {
			const {code, message} = err;
			if(code === 11000) {
				// Duplicate name error, gonna happen from time to time, no need to see the entire error
				console.log(message);
			} else {
				// Unexpected error, log error in its entirety
				console.error(err);
			}
		});
	return newParent;
}

const submissionPolling = AsyncPolling(getNewSubmissions, 2500); // 2.5 seconds
const messagePolling = AsyncPolling(getMessages, 15000); // 15 seconds

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
	});
	// for(let item of res) {
	// 	const {over_18, domain, title, subreddit_name_prefixed } = item;
	// 	if(over_18) return;
	// 	switch(domain) {
	// 		case 'twitter.com':
	// 			// handle twitter
	// 			handleTwitter(item);
	// 			break;
	// 		case 'my.mixtape.moe':
	// 			// handle mixtape
	// 			handleLinkInUrl(item);
	// 			break;
	// 		case 'track5.mixtape.moe':
	// 			// handle mixtape
	// 			handleLinkInUrl(item);
	// 			break;
	// 		case 'track4.mixtape.moe':
	// 			// handle mixtape
	// 			handleLinkInUrl(item);
	// 			break;
	// 		case 'u.nya.is':
	// 			// handle nya
	// 			handleLinkInUrl(item);
	// 			break;
	// 		default:
	// 		// handle default
	// 	}
	// 	// console.log(`[${subreddit_name_prefixed}] ${title}`)
	// }
});

messagePolling.on('run', () => console.log('Message polling is running...'));
messagePolling.on('start', () => console.log('Polling messages...'));
messagePolling.on('error', err => console.error(err));
messagePolling.on('result', res => {
	console.log(`Unread messages: ${res.length}`);
	for(let item of res) {
		handleNewMessage(item);
	}
});


messagePolling.run();
submissionPolling.run();