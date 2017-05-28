const mongoose = require('mongoose');
const Comment = mongoose.model('Comment');
const Submission = mongoose.model('Submission');

exports.saveMetadata = (comment, item) => {
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
};

exports.createComment = (streamableUrl, item) => {
	const { title, name } = item;
	const footer = `___  \n^This ^message ^was ^created ^by ^a ^bot  \n[Request Mirror](https://www.reddit.com/message/compose?to=testBottest777&subject=Request%20mirror&message=Enter%20your%20urls%20here) | [Creator](https://www.reddit.com/user/eRodY/) | [v2.0.0](https://github.com/Erody/twitter-to-streamable)`;
	if(title && name) {
		// replying to a top level post
		return `[Mirror - ${title}](${streamableUrl})  \n${footer}`
	} else {
		// replying to a private message
		return `[Mirror](${streamableUrl})  \n${footer}`
	}

};

// pass array of objects(!) and key to check.
// function then checks which object has the highest value of the specified key and returns that object
exports.getHighestKeyValue = (arr, key) => {
	let result;
	arr.forEach(obj => {
		if(result === undefined) {
			result = obj;
		}
		if(obj[key] > result[key]) {
			result = obj;
		}
	});
	return result;
};

// takes 2 arrays of objects and the property to check difference by
// returns all objects from the new object that aren't in the old object.
exports.difference = (oldArr, newArr, property) => {
	const names = oldArr.map(obj => obj[property]);
	return newArr.filter(obj => {
		return !names.includes(obj[property]);
	})
};