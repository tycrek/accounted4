import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { getTokenFromCode, Provider, ProviderOptions } from '../Provider';

type TWITCH_SCOPES =
	'analytics:read:extensions' |
	'analytics:read:games' |
	'bits:read' |
	'channel:edit:commercial' |
	'channel:manage:broadcast' |
	'channel:manage:extensions' |
	'channel:manage:polls' |
	'channel:manage:predictions' |
	'channel:manage:redemptions' |
	'channel:manage:schedule' |
	'channel:manage:videos' |
	'channel:read:editors' |
	'channel:read:goals' |
	'channel:read:hype_train' |
	'channel:read:polls' |
	'channel:read:predictions' |
	'channel:read:redemptions' |
	'channel:read:stream_key' |
	'channel:read:subscriptions' |
	'clips:edit' |
	'moderation:read' |
	'moderator:manage:banned_users' |
	'moderator:read:blocked_terms' |
	'moderator:manage:blocked_terms' |
	'moderator:manage:automod' |
	'moderator:read:automod_settings' |
	'moderator:manage:automod_settings' |
	'moderator:read:chat_settings' |
	'moderator:manage:chat_settings' |
	'user:edit' |
	'user:edit:follows' |
	'user:manage:blocked_users' |
	'user:read:blocked_users' |
	'user:read:broadcast' |
	'user:read:email' |
	'user:read:follows' |
	'user:read:subscriptions' |
	'channel:moderate' |
	'chat:edit' |
	'chat:read' |
	'whispers:read' |
	'whispers:edit';

export interface TwitchOptions extends ProviderOptions {
	scopes?: TWITCH_SCOPES[] | string[];

	/**
	 * Defaults to `false`. From [Twitch OAuth2 docs](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#get-the-user-to-authorize-your-app):
	 * 
	 * > Set to **true** to force the user to re-authorize your app’s access to their resources. The default is **false**.
	 */
	force_verify?: boolean;
}

/**
 * https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow
 */
export class Twitch implements Provider {
	name = 'twitch';
	baseUrl: string;
	options: TwitchOptions;
	authUrl = 'https://id.twitch.tv/oauth2/authorize';
	tokenUrl = 'https://id.twitch.tv/oauth2/token';
	redirectUri: string;

	constructor(baseUrl: string, options: TwitchOptions) {
		this.baseUrl = baseUrl;
		this.options = options;
		this.redirectUri = `${this.baseUrl}/accounted4/${this.name}`;

		// Build auth url
		this.authUrl = `${this.authUrl}?`.concat(encodeObjectAsParams({
			client_id: this.options.clientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			scope: ''.concat(this.options.scopes?.join(' ') || '').trim(),
			force_verify: this.options.force_verify ?? false,
		}));
	}

	onSuccess(req: Request, res: Response, next: NextFunction) {
		getTokenFromCode(this, req, res, next, this.tokenUrl,
			encodeObjectAsParams({
				code: req.query.code,
				client_id: this.options.clientId,
				client_secret: this.options.clientSecret,
				redirect_uri: this.redirectUri,
				grant_type: 'authorization_code',
			}), this.sessionDataSchema);
	}

	sessionDataSchema(provider: Provider, data: any) {
		return {
			created: Date.now() / 1000,
			provider: provider.name,
			token: data.access_token
		};
	}
}
