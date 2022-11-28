import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

const app = express();

// init
dotenv.config();

//Middleware
app.use(express.json());

// Parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

app.get('/', function (_req, res) {
	res.send('Hello World');
});

app.listen(PORT, () =>
	console.log(
		`Server running on port ${PORT} in ${process.env.NODE_ENV} mode...`
	)
);

//graph.facebook.com/v6.0/me/subscribed_apps?access_token=[ACCESS_TOKEN_here]&subscribed_fields=messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads

//Fecth FB page id
app.get('/subscribe', async (req, res) => {
	const response = await axios.post(
		'https://graph.facebook.com/v6.0/me/subscribed_apps',
		{
			params: {
				subscribed_fields:
					'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads',
				access_token: `${process.env.ACCESS_TOKEN}`,
			},
		}
	);
	const { data } = response;

	console.log(data);
	return;
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
	// Your verify token. Should be a random string.
	const VERIFY_TOKEN = process.env.ACCESS_TOKEN;

	// Parse the query params
	let mode = req.query['hub.mode'];
	let token = req.query['hub.verify_token'];
	let challenge = req.query['hub.challenge'];

	// Checks if a token and mode is in the query string of the request
	if (mode && token) {
		// Checks the mode and token sent is correct
		if (mode === 'subscribe' && token === VERIFY_TOKEN) {
			// Responds with the challenge token from the request
			console.log('WEBHOOK_VERIFIED');
			res.status(200).send(challenge);
		} else {
			// Responds with '403 Forbidden' if verify tokens do not match
			res.sendStatus(403);
		}
	}
});

// Received FB webhook post request
app.post('/webhook', (req, res) => {
	let body = req.body;

	// Checks if this is an event from a page subscription
	if (body.object === 'page') {
		// Iterates over each entry - there may be multiple if batched
		body.entry.forEach(function (entry) {
			// Gets the body of the webhook event
			let webhookEvent = entry.messaging[0];
			console.log(webhookEvent);

			// Get the sender PSID
			let senderPsid = webhookEvent.sender.id;
			console.log('Sender PSID: ' + senderPsid);

			// Check if the event is a message or postback and
			// pass the event to the appropriate handler function
			// if (webhookEvent.message) {
			// 	handleMessage(senderPsid, webhookEvent.message);
			// } else if (webhookEvent.postback) {
			// 	handlePostback(senderPsid, webhookEvent.postback);
			// }
		});

		// Returns a '200 OK' response to all requests
		res.status(200).send('EVENT_RECEIVED');
	} else {
		// Returns a '404 Not Found' if event is not from a page subscription
		res.sendStatus(404);
	}
});
