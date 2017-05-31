const { createComment } = require('../helpers');
const mongoose = require('mongoose');
const Parent = mongoose.model('Parent');
const redditEvents = require('./poll').redditEvents;

redditEvents.on('newParent', (urls, item, parent) => {
	if(parent.replied) return;
	for(url of urls) {
		postComment(url, item)
			.catch(err => console.error(err))
	}
	parent.replied = true;
	parent
		.save()
		.catch(err => console.error(err));
});


async function postComment(streamableUrl, item) {
	console.log('creating comment');
	const commentText = createComment(streamableUrl, item);
	console.log(`created commentText: ${!!commentText}`);
	const comment = await item.reply(commentText);
	console.log(`Comment name: ${comment.name}`);
}