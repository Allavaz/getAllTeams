const MongoClient = require('mongodb').MongoClient;
const { host, user, pw, dbname } = require('./db.json');
const encuser = encodeURIComponent(user);
const encpw = encodeURIComponent(pw);
const authMechanism = 'DEFAULT';
const url = `mongodb://${encuser}:${encpw}@${host}:27017/?authMechanism=${authMechanism}`;
const {app, dialog} = require('electron');
const fs = require('fs');

let missingTeams = [];

app.on('ready', () => {
	dialog.showOpenDialog(
		{filters: [
			{name:'Teams.json', extensions: ['json']}
		]},
		{properties: ['openFile']}
	).then((result) => {
		if (result.canceled) {
			app.exit(0);
		} else {
			console.log('Connecting to database...\n');
			let path = result.filePaths[0];
			try {
				let data = fs.readFileSync(path);
				let json = JSON.parse(data);
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
									json[item._id].toLowerCase();
								} catch(e) {
									try {
										missingTeams.push(item._id);
									} catch(e) {
										console.error(e);
										app.exit(0);
									}
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
							app.exit(0);
						});
				});
			} catch(e) {
				console.error(e);
				app.exit(0);
			}
		}
	});
});