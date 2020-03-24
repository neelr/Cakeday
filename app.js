//packages
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const Airtable = require('airtable');
const qs = require('querystring');
const base = new Airtable({ apiKey: process.env.KEY }).base(process.env.BASE);
const app = express();

app.use(express.static('./static/'));

const BIRTHDAY_FIELD = 'XfQN2QL49W';

var slack = (user, text, ts) => {
	return new Promise((res, rej) => {
		axios
			.post(
				'https://slack.com/api/chat.postMessage',
				qs.stringify({ token: process.env.BOT, channel: user, text: text, thread_ts: ts })
			)
			.then((data) => {
				res(data.data);
			});
	});
};
app.get('/slack', (req, res) => {
	let found = false;
	console.log(req.query);
	axios
		.get(
			`https://slack.com/api/oauth.acess?client_id=${SLACK_CLIENT_ID}&client_secret=${process.env
				.SECRET}&code=${res.query.code}`
		)
		.then((r) => {
			base('CakeDay').select({ view: 'Grid view' }).eachPage(
				(records, next) => {
					records.forEach((record) => {
						console.log(record.get('ID') == r.data.user_id);
						if (record.get('ID') == r.data.user_id) {
							found = true;
						}
					});
					next();
				},
				() => {
					if (!found) {
						base('CakeDay').create([ { fields: { ID: r.data.user_id } } ]);
					}
				}
			);
			res.redirect('/done.html');
		});
});

//Express callback
app.get('/birthday', (req, res) => {
	let date = new Date();
	if (req.query.key == process.env.TOKEN) {
		res.sendStatus(200);
		base('CakeDay').select({ view: 'Grid view' }).eachPage((records, next) => {
			records.forEach((record) => {
				axios
					.get(`https://slack.com/api/users.profile.get?token=${process.env.OAUTH}&user=${record.get('ID')}`)
					.then((r, record) => {
						if (r.data.profile.fields.BIRTHDAY_FIELD) {
							let bday = new Date(r.data.profile.fields.BIRTHDAY_FIELD.value);
							s;
							if (
								bday.getDate() == date.getDate() &&
								bday.getMonth() == date.getMonth() &&
								record.get('lastSent') != date.getFullYear()
							) {
								slack(
									process.env.CHANNEL,
									`Happy CakeDay to <@${record.get(
										'ID'
									)}>! Have a wonderful day! :tada: :party_orpheus:`
								);
								base('CakeDay').update([ { fields: { lastSent: date.getFullYear() } } ]);
							}
						}
					});
			});
			next();
		});
	} else {
		res.sendStatus(401);
	}
});

app.listen(3000, () => console.log('Cake Man on 3000'));
