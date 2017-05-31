const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
	created: {
		type: Date,
		default: Date.now()
	},
	name: {
		type: String,
		required: 'You must supply a name.',
		unique: true
	},
	upvotes: Number,
	submission: {
		type: mongoose.Schema.ObjectId,
		ref: 'Parent'
	},
	replied: Boolean,
	streamableUrl: {
		type: String,
		required: 'You must suplly a streamable url'
	}
});


module.exports = mongoose.model('Comment', commentSchema);