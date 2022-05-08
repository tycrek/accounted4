import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { Provider, ProviderOptions } from '../Provider';

export interface TwitchOptions extends ProviderOptions {
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
			scope: ''.concat(this.options.scopes?.join(' ') || '').trim()
		}));
	}

	onSuccess(req: Request, res: Response, next: NextFunction) {
		axios
			.post(this.tokenUrl, encodeObjectAsParams({
				code: req.query.code,
				client_id: this.options.clientId,
				client_secret: this.options.clientSecret,
				redirect_uri: this.redirectUri,
				grant_type: 'authorization_code',
			}))
			.then(({ data }) => {
				if (data.error) throw new Error(data.error_description);
				req.session.accounted4 = {
					provider: this.name,
					token: data.access_token
				};
			})
			.then(() => res.redirect(req.session?.postAuthPath ?? '/'))
			.catch(next);
	}
}
