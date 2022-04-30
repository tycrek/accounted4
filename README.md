[//]: # (NPM centered badge template START --------------------------------------------------)

<div align="center">

accounted4
===

[![NPMCBT badge]][NPMCBT link]

*Express middleware for easy OAuth with a variety of providers.*
</div>

[NPMCBT badge]: https://img.shields.io/npm/v/@tycrek/accounted4?color=CB3837&label=%20View%20on%20NPM&logo=npm&style=for-the-badge
[NPMCBT link]: https://www.npmjs.com/package/@tycrek/accounted4

[//]: # (NPM centered badge template END ----------------------------------------------------)

**accounted4** is intended to make it easy for developers to add third-party OAuth support to their Node.js applications. This project is still in its infancy; more features and providers will be added in the future. **Currently the only supported provider is Discord**.

## Usage

**Install** the [`@tycrek/accounted4`](https://www.npmjs.com/package/@tycrek/accounted4) package:

```bash
npm i @tycrek/accounted4

# You'll also need express-session and a Session storage. Optimally you'll use something other than MemoryStore in production.
npm i express-session memorystore
```

**Use** the `Accounted4` class:

```ts
import { Accounted4, Providers } from '@tycrek/accounted4';
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';

// Set up your Express app
const app = express();

// Setup sessions
const sessionStore = MemoryStore(session);
let DAY = 86400000;

// Please be aware that this code is provided simply for demo purposes.
// You should properly implement Session storage for production.
app.use(session({
	name: 'accounted4',
	resave: true,
	saveUninitialized: false,
	cookie: { maxAge: DAY, secure: false /* set to true if using HTTPS*/ },
	secret: (Math.random() * 100).toString(),
	store: new sessionStore({ checkPeriod: DAY }) as any,
}));

// Set the hostname
const hostname = 'localhost';

// Create a Discord provider
const discord = new Providers.Discord({
        BASE_URL: Accounted4.buildBaseUrl(hostname),
        CLIENT_ID: /* Your Discord client ID here */,
        CLIENT_SECRET: /* Your Discord client secret here */,
        SCOPES: ['guilds.join email'] // Optional, add any additional scopes you need
    });

// Create an instance of Accounted4
const ac4 = new Accounted4(app, discord, { hostname });

// Now use Accounted4 on either all routes or just a specific subset of routes
app.use(ac4.auth());
// or
app.use('/my-private-zone', ac4.auth());
```

### README is still WIP, please check back soon
