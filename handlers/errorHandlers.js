/*
 Catch Errors Handler

 With async/await, you need some way to catch errors
 Instead of using try{} catch(e) {} in each controller, we wrap the function in
 catchUnhandled() catch any errors and log them to the console.
 */

exports.catchUnhandled = () => {
	process.on('unhandledRejection', err => {
		console.error(err);
	})
};