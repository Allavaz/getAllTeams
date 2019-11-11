const MongoClient = require('mongodb').MongoClient;
const { host, user, pw, dbname } = require('./db.json');
const encuser = encodeURIComponent(user);
const encpw = encodeURIComponent(pw);
const authMechanism = 'DEFAULT';
const url = `mongodb://${encuser}:${encpw}@${host}:27017/?authMechanism=${authMechanism}`;
const Teams = require('./Teams');
let missingTeams = [];

console.log('Connecting to database...');

MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
	const db = client.db(dbname);
	db.collection('matchesaux').aggregate(
		[{$project: {
			'teams.teamname': 1
		}}, {$unwind: {
			path: '$teams',
			includeArrayIndex: 'i',
			preserveNullAndEmptyArrays: true
		}}, {$group: {
			_id: '$teams.teamname',
		}}]
	)
		.sort({_id: 1})
		.toArray((err, docs) => {
			docs.forEach((item) => {
				try {
					Teams[item._id].toLowerCase();
				} catch(e) {
					missingTeams.push(item._id);
				} 
			});
			client.close();
			if (missingTeams.length === 0) {
				console.log('No missing teams for now.');
			} else {
				console.log('Missing teams:');
				missingTeams.forEach((item) => {
					console.log(item);
				});
			}
		});
});