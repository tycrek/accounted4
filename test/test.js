// Import packages
const express = require('express');
const session = require('express-session')
const { Accounted4, Providers } = require('../dist/accounted4');
const { Discord } = require('../dist/providers/Discord');

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
const discord = new Discord({
	BASE_URL: Accounted4.buildBaseUrl('dev.lh', false, 8080),
	CLIENT_ID: secrets.DISCORD_CLIENT_ID,
	CLIENT_SECRET: secrets.DISCORD_CLIENT_SECRET,
	SCOPES: ['guilds'],
});
const spotify = new Providers.Spotify({
	BASE_URL: Accounted4.buildBaseUrl('dev.lh', false, 8080),
	CLIENT_ID: secrets.SPOTIFY_CLIENT_ID,
	CLIENT_SECRET: secrets.SPOTIFY_CLIENT_SECRET
});
const microsoft = new Providers.Microsoft({
	BASE_URL: Accounted4.buildBaseUrl('localhost', false, 8080),
	CLIENT_ID: secrets.MICROSOFT_CLIENT_ID,
	CLIENT_SECRET: secrets.MICROSOFT_CLIENT_SECRET,
	SCOPES: ['user.read', 'offline_access'],
});

// Create Accounted4
const ac4 = new Accounted4(app, microsoft, {
	hostname: 'localhost',
	port: 8080
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