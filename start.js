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
require('./models/Submission');

require('./controllers/reddit');

// todo post the comments with TwitterToStreamable, not testbottest777
// todo retry to upload to streamable (with delay) upon error
// todo periodically update the metadata (just loop over all comments in the db and get updated data) - probably a seperate application.
// todo maybe create a website for this bot (live updating metadata, latest comments etc)