const mongoose = require('mongoose');

// import environmental variables from our variables.env file
require('dotenv').config({ path: 'variables.env' });

// Connect to our Database and handle an bad connections
mongoose.connect(process.env.MONGODB);
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', (err) => {
	console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`);
});

const Pusher = require('pusher-client');
const options = {
	secret: process.env.REDDIT_SECRET,
	keepAlive: true
};
const pusher = new Pusher('50ed18dd967b455393ed');

// Subscribing to subreddits dynamically
	// Get list of subreddits from database
	// Loop over them and subscribe to each of them on program start
	// Users can message bot with specific code, text, whatever to add a subreddit to the database
const videos = pusher.subscribe('videos');
const soccer = pusher.subscribe('soccer');
videos.bind('new-listing', (listing) => console.log(`[videos] ${listing.title}`));
soccer.bind('new-listing', (listing) => console.log(`[soccer] ${listing.title}`));
pusher.connection.bind('state_change', function(states) {
	console.log(states.current);
});
