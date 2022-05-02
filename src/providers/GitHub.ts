import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { Provider } from '../Provider';

interface GitHubOptions {
	BASE_URL: string;
	CLIENT_ID: string;
	CLIENT_SECRET: string;
	SCOPES?: string[];
}

/**
 * https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps
 */
export class GitHub implements Provider {
	name = 'github';
	options: GitHubOptions;
	authUrl = 'https://github.com/login/oauth/authorize';
	tokenUrl = 'https://github.com/login/oauth/access_token';
	redirectUri: string;

	constructor(options: GitHubOptions) {
		this.options = options;
		this.redirectUri = `${this.options.BASE_URL}/accounted4/${this.name}`;

		// Build auth url
		this.authUrl = `${this.authUrl}?`.concat(encodeObjectAsParams({
			client_id: this.options.CLIENT_ID,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			scope: ''.concat(this.options.SCOPES?.join(' ') || '').trim()
		}));
	}

	onSuccess(req: Request, res: Response, next: NextFunction) {
		axios
			.post(this.tokenUrl, encodeObjectAsParams({
				code: req.query.code,
				client_id: this.options.CLIENT_ID,
				client_secret: this.options.CLIENT_SECRET,
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
