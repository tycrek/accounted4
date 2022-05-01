// Import packages
const express = require('express');
const session = require('express-session')
const { Accounted4 } = require('../dist/accounted4');
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

// Create the Discord provider
const secrets = require('./secrets.json');
const discord = new Discord({
	BASE_URL: Accounted4.buildBaseUrl('dev.lh', false, 8080),
	CLIENT_ID: secrets.DISCORD_CLIENT_ID,
	CLIENT_SECRET: secrets.DISCORD_CLIENT_SECRET,
	SCOPES: ['guilds'],
});

// Create Accounted4
const ac4 = new Accounted4(app, discord, {
	hostname: 'dev.lh',
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

app.listen(8080, () => console.log('Listening on port 8080! Click here: http://dev.lh:8080'));