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

require('./controllers/reddit');

// todo do the polling in a polling controller, not in reddt controller
// todo post the comments with TwitterToStreamable, not testbottest777
// todo database implementation - save a bunch of metadata (save every comment with createdAt, subreddit, title (of submission), upvotes/downvotes of submission (initially always 0), upvotes/downvotes of comment (initially always 0)
// todo periodically update the metadata (just loop over all comments in the db and get updated data) - probably a seperate application.
// todo maybe create a website for this bot (live updating metadata, latest comments etc)