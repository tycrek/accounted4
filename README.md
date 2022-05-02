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

**accounted4** is intended to make it easy for developers to add third-party OAuth support to their Node.js applications. This project is still in its infancy; more features and providers will be added in the future. Currently supported OAuth providers are Microsoft, GitHub, Discord, and Spotify.

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

For any provider you choose, you'll have to set up an "app" on the corresponding developer dashboard. See below for details on how to set this up for each provider.


<details>
<summary><strong>Microsoft</strong></summary>

Microsoft is quite in-depth, so we'll skip the details here for now. Documentation will be added at a later date.

</details>
<details>
<summary><strong>GitHub</strong></summary>

[Create a GitHub app](https://github.com/settings/applications/new). For the **Authorization callback URL**, use the **production** redirect URI. You do not need to enable **Device Flow** but you can if you want. Once created, find the **Client ID** and generate a new **Client secret**. Copy these for the next step. [Visit GitHub's documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps) for more information on scopes.

</details>
<details>
<summary><strong>Discord</strong></summary>

[Create a Discord app](https://discord.com/developers/applications). Once your app is created, click the **OAuth2** tab and copy the **Client ID** and reset the **Client Secret**. Make sure you add **both** redirect URIs. [Visit Discord's documentation](https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes) for more information on scopes.

</details>
<details>
<summary><strong>Spotify</strong></summary>

[Create a Spotify app](https://developer.spotify.com/dashboard) ([tutorial](https://developer.spotify.com/documentation/general/guides/authorization/app-settings/)). Once your app is created, you should see your **Client ID** and a button to **SHOW** your **Client secret**. Copy these for the next step. Click on **Edit Settings** and add **both** redirect URI's. [Visit Spotify's documentation](https://developer.spotify.com/documentation/general/guides/authorization/scopes/) for more information on scopes.

</details>
<br>

Once your provider is configured, add the details to your code:

```ts
const hostname = 'localhost';

const provider = new Providers.__PROVIDER_NAME_HERE__({
    BASE_URL: Accounted4.buildBaseUrl(hostname),
    CLIENT_ID: /* Your provider client ID here */,
    CLIENT_SECRET: /* Your provider client secret here */,
    /* All providers also accept an optional SCOPES array */
});
```

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

- [x] **Microsoft**
- [x] **GitHub**
- [x] **Discord**
- [x] **Spotify**
- [ ] Google
- [ ] Twitch
- [ ] Yahoo
- [ ] Amazon
- [ ] Facebook
- [ ] Apple
- [ ] Twitter
- [ ] Reddit

## To-do

- [ ] Add providers
- [ ] Add documentation/tests/examples
- [ ] Add support for multiple providers
- [ ] Implement logout
- [ ] Implement refreshing tokens
- [ ] Automatic State checking
