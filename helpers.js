// pass array of objects(!) and key to check.
// function then checks which object has the highest value of the specified key and returns that object
exports.getHighestKeyValue = (arr, key) => {
	let result;
	arr.forEach(obj => {
		if(result === undefined) {
			result = obj;
		}
		if(obj[key] > result[key]) {
			result = obj;
		}
	});
	return result;
};