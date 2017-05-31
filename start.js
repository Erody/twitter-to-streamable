const mongoose = require('mongoose');
require('./handlers/errorHandlers').catchUnhandled();

// import environmental variables from our variables.env file
require('dotenv').config({ path: 'variables.env' });

// Connect to our Database and handle an bad connections
mongoose.connect(process.env.MONGODB);
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', (err) => {
	console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`);
});

// import all of our models
require('./models/Comment');
require('./models/Parent');

require('./controllers/poll');
require('./controllers/reddit');


// todo rewrite this again - Split the bot into two parts.
	// One polls /r/all and a few more subreddits and checks for video links, converts them to streamable and adds those links to a queue (mongo)
	// The other one pulls items from the queue and posts them on reddit, either as reply to a post or a message
// todo remove duplicate comments function
// todo periodically update the metadata (just loop over all comments in the db and get updated data) - probably a seperate application.
// todo maybe create a website for this bot (live updating metadata, latest comments etc)