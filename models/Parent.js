const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
	created: Date,
	name: {
		type: String,
		required: 'You must supply a name.',
		unique: true
	},
	upvotes: Number,
	replied: {
		type: Boolean,
		required: 'You must supply a replied boolean'
	},
	streamableUrls: [String]
});

module.exports = mongoose.model('Parent', parentSchema);