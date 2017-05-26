const Pusher = require('pusher-client');
const pusher = new Pusher(process.env.PUSHER_APP_ID);
const twitterController = require('./twitter');

const subreddits = ['videos', 'soccer', 'gaming', 'askreddit', 'testingMyBotsAndStuff', 'games', 'guitar', 'liverpoolfc', 'pics', 'all', 'worldnews', 'aww', 'getmotivated', 'gifs', 'showerthoughts'];
// Subscribing to subreddits dynamically
// Get list of subreddits from database
// Loop over them and subscribe to each of them on program start
// Users can message bot with specific code, text, whatever to add a subreddit to the database
subreddits.forEach(subreddit => {
	pusher.subscribe(subreddit).bind('new-listing', listing => console.log(`[${subreddit}] ${listing.title}`));
});

//videos.bind('new-listing', (listing) => console.log(`[videos] ${JSON.stringify(listing, null, 2)}`));
/*
	important properties:
		id
		name
		over_18
		domain
		url
 */

pusher.connection.bind('state_change', function(states) {
	console.log(`Pusher state change: ${states.previous} → ${states.current}`);
});


// twitterController.getVideoUrl('867365689148887040').then(res => console.log(`res: ${res}`));
// twitterController.getVideoUrl('858048552567787520').then(res => console.log(`res: ${res}`));


module.exports = pusher;