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

**accounted4** is intended to make it easy for developers to add third-party OAuth support to their Node.js applications. This project is still in its infancy; more features and providers will be added in the future. Supported OAuth providers are [detailed below](#providers).

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

#### Redirect URI's

Pretty much every provider requires a redirect URI. This is the URL that the provider will redirect to after the user has authenticated. To save some bytes, I'll just describe the redirect URI here, then you'll use it for all providers. If any providers use a different format, I'll note those differences in their subsection.

- **For local development:** `http://localhost:8080/accounted4/<provider-name>`
- **For production:** `https://<your-domain.com>/accounted4/<provider-name>`

Replace `<provider-name>` with the name of the provider, as listed below, **in lowercase**. You do not need a trailing slash. For example: `https://awesome-website.com/accounted4/github` or `http://localhost:8080/accounted4/microsoft`.

#### Providers

<details>
<summary><strong>Discord</strong></summary>

[Create a Discord app](https://discord.com/developers/applications). Once your app is created, click the **OAuth2** tab and copy the **Client ID** and reset the **Client Secret**. Make sure you add **both** redirect URIs. [Visit Discord's documentation](https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes) for more information on scopes.

</details>
<details>
<summary><strong>GitHub</strong></summary>

[Create a GitHub app](https://github.com/settings/applications/new). For the **Authorization callback URL**, use the **production** redirect URI. You do not need to enable **Device Flow** but you can if you want. Once created, find the **Client ID** and generate a new **Client secret**. Copy these for the next step. [Visit GitHub's documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps) for more information on scopes.

</details>
<details>
<summary><strong>Google</strong></summary>

[Create a Google Cloud project](https://console.cloud.google.com/home/dashboard). Using the search bar, start typing "APIs and Services", then select **APIs & Services**. Follow these steps to configure your app:

1. On the left of the dashboard, select **OAuth consent screen**.
2. Choose **External** and click **Create**.
3. The next page sets up your app metadata. Enter anything required, but feel free to leave optional items blank.
4. The next page asks for scopes. If you already know what scopes you require, enter them now. Otherwise, continue. [Visit Google's documentation](https://developers.google.com/identity/protocols/oauth2/scopes) for more information on scopes.
5. The next page asks for test users. Add yourself and any other Google account you wish to test your app. Make sure to enter the email address of any testers (the email must correspond to a Google account).
6. If the summary looks good to you, click on **Credentials** on the left of the dashboard.
7. Click on **+ Create credentials**, then **OAuth client ID**.
8. Choose **Web application** for the type and give it a name.
9. Add **both** redirect URI's from above as **Authorized redirect URIs** (you don't need any **Authorized JavaScript origins**).
10. Click **Create**. You will be shown your **Client ID** and **Client secret**. Copy these for the next step.

</details>
<details>
<summary><strong>Microsoft</strong></summary>

Microsoft is quite in-depth, so we'll skip the details here for now. Documentation will be added at a later date.

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

- [x] **[Discord](https://discord.com/developers/docs/topics/oauth2)**
- [x] **[GitHub](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)**
- [x] **[Google](https://developers.google.com/identity/protocols/oauth2/web-server#obtainingaccesstokens)**
- [x] **[Microsoft](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)**
- [x] **[Spotify](https://developer.spotify.com/documentation/general/guides/authorization/code-flow/)**
- [ ] [Twitch](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow)
- [ ] [Yahoo](https://developer.yahoo.com/oauth2/guide/flows_authcode/)
- [ ] [Amazon](https://developer.amazon.com/docs/login-with-amazon/authorization-code-grant.html)
- [ ] [Facebook](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow#login)
- [ ] [Twitter](https://developer.twitter.com/en/docs/authentication/oauth-2-0/authorization-code)
- [ ] [Reddit](https://github.com/reddit-archive/reddit/wiki/OAuth2)
- [ ] [Shutterstock](https://www.shutterstock.com/developers/documentation/authentication#oauth-authentication)
- [ ] [LinkedIn](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [ ] [Intuit](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
- [ ] [Adobe](https://developer.adobe.com/developer-console/docs/guides/authentication/OAuth/)
- [ ] [PayPal](https://developer.paypal.com/api/rest/authentication/)?
- [ ] [Eventbrite](https://www.eventbrite.com/platform/docs/authentication#getting-started-with-authentication)
- [ ] [Dropbox](https://developers.dropbox.com/oauth-guide)
- [ ] [Slack](https://api.slack.com/legacy/oauth)
- [ ] [Bitly](https://dev.bitly.com/docs/getting-started/authentication/)
- [ ] [Box](https://developer.box.com/guides/authentication/oauth2/without-sdk/)
- [ ] [GitLab](https://docs.gitlab.com/ee/api/oauth2.html#authorization-code-flow)
- [ ] [Imgur](https://apidocs.imgur.com/#authorization-and-oauth)
- [ ] [Instagram](https://developers.facebook.com/docs/instagram-basic-display-api/reference/oauth-authorize)
- [ ] [Stripe](https://stripe.com/docs/connect/oauth-reference)?
- [ ] [Stack Exchange](https://api.stackexchange.com/docs/authentication)
- [ ] [Strava](https://developers.strava.com/docs/authentication/#requestingaccess)
- [ ] [Vimeo](https://developer.vimeo.com/api/authentication#using-the-auth-code-grant)
- [ ] [VK](https://dev.vk.com/reference) (it's in russian)
- [ ] [Yandex](https://yandex.com/dev/id/)
- [ ] [Zoho](https://www.zoho.com/accounts/protocol/oauth/web-apps/authorization.html)
- [ ] [SoundCloud](https://developers.soundcloud.com/docs#authentication)
- [ ] [Flickr](https://www.flickr.com/services/api/auth.oauth.html)?
- [ ] [Pocket](https://getpocket.com/developer/docs/authentication)
- [ ] [Pinterest](https://developers.pinterest.com/docs/api/v5/#tag/oauth)
- [ ] [Tumblr](https://www.tumblr.com/docs/en/api/v2#oauth2-authorization)
- [ ] [TikTok](https://developers.tiktok.com/doc/login-kit-web)
- ~~Apple~~ *(annoyingly complex guidelines)*

## To-do

- [ ] Add providers
- [ ] Add documentation/tests/examples
- [ ] Add support for multiple providers
- [ ] Implement logout
- [ ] Implement refreshing tokens
- [ ] Automatic State checking
