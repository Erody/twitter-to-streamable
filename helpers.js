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
	const { id, title, name } = item;
	return `[Mirror - ${title}](${streamableUrl})  \n___  \nTwitterToStreamable 2.0.0  \nIf you have any suggestions you can message my creator here: [PM](https://www.reddit.com/message/compose?to=eRodY&subject=[TwitterToStreamable]%20-%20${name})`
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