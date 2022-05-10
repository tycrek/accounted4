// Import packages
const express = require('express');
const session = require('express-session')
const { Accounted4 } = require('../dist/accounted4');

// Set up Express
const app = express();
const MemoryStore = require('memorystore')(session);

// Also set up the session (must be BEFORE creating Accounted4)
const DAY = 86400000;
app.use(session({
	name: 'ac4',
	resave: true,
	saveUninitialized: false,
	cookie: { maxAge: DAY, secure: false },
	secret: (Math.random() * 100).toString(),
	store: new MemoryStore({ checkPeriod: DAY }),
}));

// Create the provider
const secrets = require('./secrets.json');

// Create Accounted4
const ac4 = new Accounted4(app, {
	hostname: 'localhost',
	port: 8080,
	defaultProvider: 'Discord',
	optionalProviders: ['GitHub'], // ! optionalProviders not yet implemented
	providerOptions: {
		Microsoft: {
			// Required by every provider
			clientId: secrets.MICROSOFT_CLIENT_ID,
			clientSecret: secrets.MICROSOFT_CLIENT_SECRET,

			// Optional for every provider (some have defaults)
			scopes: ['user.read', 'offline_access'], // You can add additional scopes

			// Optional for Microsoft (other providers may have other optional properties)
			tenant: 'consumers',
		},
		GitHub: {
			clientId: secrets.GITHUB_CLIENT_ID,
			clientSecret: secrets.GITHUB_CLIENT_SECRET,
		},
		Twitch: {
			clientId: secrets.TWITCH_CLIENT_ID,
			clientSecret: secrets.TWITCH_CLIENT_SECRET,
		},
		Discord: {
			prompt: 'none',
			scopes: ['email', 'guilds.join'],
			clientId: secrets.DISCORD_CLIENT_ID,
			clientSecret: secrets.DISCORD_CLIENT_SECRET,
		}
	}
});

// Apply middleware to restricted routes
app.use('/user', ac4.auth());

// Public routes
app.get('/', (req, res) => res.send('hi'));

// Restricted routes
app.get('/user', (req, res) => res.send(`welcome! signed in via: ${req.session.accounted4.provider}`));
app.get('/user/egg', (req, res) => res.send('Easter time'))

// Error handling
app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).send('Something broke!');
})

app.listen(8080, () => console.log('Listening on port 8080! Click here: http://localhost:8080'));