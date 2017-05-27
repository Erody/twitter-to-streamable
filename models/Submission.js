const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
	created: Date,
	name: {
		type: String,
		required: 'You must supply a name.'
	},
	subreddit: String,
	title: String,
	upvotes: Number,
	permalink: String
});

module.exports = mongoose.model('Submission', submissionSchema);