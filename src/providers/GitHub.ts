import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { Provider, ProviderOptions } from '../Provider';

export interface GitHubOptions extends ProviderOptions {
}

/**
 * https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps
 */
export class GitHub implements Provider {
	name = 'github';
	baseUrl: string;
	options: GitHubOptions;
	authUrl = 'https://github.com/login/oauth/authorize';
	tokenUrl = 'https://github.com/login/oauth/access_token';
	redirectUri: string;

	constructor(baseUrl: string, options: GitHubOptions) {
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
			}), { headers: { Accept: 'application/json' } })
			.then(({ data }) =>
				req.session.accounted4 = {
					provider: this.name,
					token: data.access_token
				})
			.then(() => res.redirect(req.session?.postAuthPath ?? '/'))
			.catch(next);
	}
}
