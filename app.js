require('dotenv').config();
const express = require('express');
const axios = require('axios');
var Airtable = require('airtable');
var qs = require('querystring');
var base = new Airtable({ apiKey: process.env.KEY }).base(process.env.BASE);
var app = express();
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
	var found = false;
	console.log(req.query);
	axios
		.get(
			'https://slack.com/api/oauth.access?client_id=2210535565.860757160338&client_secret=' +
				process.env.SECRET +
				'&code=' +
				req.query.code
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
app.get('/birthday', (req, res) => {
	var date = new Date();
	if (req.query.key == process.env.TOKEN) {
		res.sendStatus(200);
		base('CakeDay').select({ view: 'Grid view' }).eachPage((records, next) => {
			records.forEach((record) => {
				axios
					.get(
						'https://slack.com/api/users.profile.get?token=' +
							process.env.OAUTH +
							'&user=' +
							record.get('ID')
					)
					.then((r) => {
						if (r.data.profile.fields.BIRTHDAY_FIELD) {
							var bday = new Date(r.data.profile.fields.BIRTHDAY_FIELD.value);
							if (bday.getDate() == date.getDate() && bday.getMonth() == date.getMonth()) {
								slack(
									process.env.CHANNEL,
									'Happy CakeDay to <@' +
										record.get('ID') +
										'> and hope you have a wonderful day! :party_orpheus:'
								);
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
