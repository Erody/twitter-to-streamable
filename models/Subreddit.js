const mongoose = require('mongoose');

const subredditSchema = new mongoose.Schema({
	name: {
		type: String,
		required: 'You must supply a name.'
	}
});

module.exports = mongoose.model('Subreddit', subredditSchema);