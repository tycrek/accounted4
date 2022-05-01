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

**accounted4** is intended to make it easy for developers to add third-party OAuth support to their Node.js applications. This project is still in its infancy; more features and providers will be added in the future. **Currently the only supported providers are Discord and Spotify**.

## Usage

**Install** the [`@tycrek/accounted4`](https://www.npmjs.com/package/@tycrek/accounted4) package:

```bash
npm i @tycrek/accounted4

# You'll also need express-session and a session store. Optimally you'll use something other than MemoryStore in production.
npm i express-session memorystore
```

### Preparing the code

accounted4 is intended for use with [Express](https://expressjs.com/). It requires the use of [express-session](https://www.npmjs.com/package/express-session) and a [compatible session store](https://www.npmjs.com/package/express-session#compatible-session-stores). The easiest way to get started is by using the [memorystore](https://www.npmjs.com/package/memorystore) module. In a production environment, it is recommended to use a proper database with the corresponding module for a session store.

For tutorial purposes, this README will use `memorystore`, but feel free to use another if you prefer.

```ts
import { Accounted4, Providers } from '@tycrek/accounted4';
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';

const app = express();
const sessionStore = MemoryStore(session);
```

The next block attaches the session middleware to Express. You are recommended to [adjust these settings](https://www.npmjs.com/package/express-session#options) as you see fit.

```ts
const DAY = 86400000;
app.use(session({
    name: 'accounted4',
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: DAY, secure: false /* set to true if using HTTPS*/ },
    secret: (Math.random() * 100).toString(),
    store: new sessionStore({ checkPeriod: DAY }) as any,
}));
```

This will initialize a session for each visitor to your app, which is accessible through `req.session`.

### Configure a provider

At this time, you have two choices for a provider: Discord and Spotify. When more are added, this section will be updated with the steps for each provider.

#### Discord

[Create a Discord Application](https://discord.com/developers/applications). Once your app is created, click the **OAuth2** tab and copy the **Client ID** and reset the **Client Secret**, making sure to note these down.

```ts
const hostname = 'localhost';

const provider = new Providers.Discord({
    BASE_URL: Accounted4.buildBaseUrl(hostname),
    CLIENT_ID: /* Your Discord client ID here */,
    CLIENT_SECRET: /* Your Discord client secret here */,
    /* Also accepts an optional SCOPES array */
});
```

[Visit Discord's documentation](https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes) for details on available scopes and their purpose.

#### Spotify

[Create a Spotify Application](https://developer.spotify.com/dashboard) ([tutorial](https://developer.spotify.com/documentation/general/guides/authorization/app-settings/)). Once your app is created, you should see your client ID and a button to SHOW your client secret. Note these down for the next step.

```ts
const hostname = 'localhost';

const provider = new Providers.Spotify({
    BASE_URL: Accounted4.buildBaseUrl(hostname),
    CLIENT_ID: /* Your Spotify client ID here */,
    CLIENT_SECRET: /* Your Spotify client secret here */
    /* Also accepts an optional SCOPES array */
});
```

[Visit Spotify's documentation](https://developer.spotify.com/documentation/general/guides/authorization/scopes/) for details on available scopes and their purpose.

### Configure accounted4

Finally, we create an instance of `Accounted4`. Passing the app is required as accounted4 needs to create routes for the OAuth provider to call upon for redirects. Support for more than one provider is planned for the future.

You can choose to apply the middleware to specific paths, or to the entire app.

```ts
const ac4 = new Accounted4(app, provider, { hostname });

app.use(ac4.auth());
// or
app.use('/my-private-zone', ac4.auth());
```

Now add the rest of your routes and start the app. Visiting any of your routes will redirect the user to the OAuth provider. Once they sign in, they'll be redirected back to your app.

### Using the providers' API

After successful authentication, accounted4 stores the provider name and **access token** in the session. You can access these values through the `req.session.accounted4` object. This access token can be used with the API of your chosen provider (make sure you include any necessary scopes when configuring the provider).

### Next steps

At the moment, that's all there is to it! As development continues, I'll add more docs on usage.

## List of providers

- [x] **Discord**
- [x] **Spotify**
- [ ] GitHub
- [ ] Google
- [ ] Microsoft
- [ ] Twitch
- [ ] Yahoo
- [ ] Amazon
- [ ] Facebook
- [ ] Apple
- [ ] Twitter
- [ ] Reddit
