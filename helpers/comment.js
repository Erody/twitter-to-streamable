exports.createComment = (streamableUrl, item) => {
	const { id, title, name } = item;
	return `[Mirror - ${title}](${streamableUrl})  \n___  \nTwitterToStreamable 2.0.0  \nIf you have any suggestions you can message my creator here: [PM](https://www.reddit.com/message/compose?to=eRodY&subject=[TwitterToStreamable]%20-%20${name})`
};