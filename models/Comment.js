const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
	created: {
		type: Date,
		default: Date.now()
	},
	name: {
		type: String,
		required: 'You must supply a name.'
	},
	upvotes: Number,
	submission: {
		type: mongoose.Schema.ObjectId,
		ref: 'Submission'
	}
});

module.exports = mongoose.model('Comment', commentSchema);