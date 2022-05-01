import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { Provider } from '../Provider';

interface MicrosoftOptions {
	BASE_URL: string;
	CLIENT_ID: string;
	CLIENT_SECRET: string;
	/**
	 * Includes openid by default
	 */
	SCOPES?: string[];
	/**
	 * Defaults to consumers
	 */
	TENANT?: 'consumers' | 'organizations' | 'common';
}

/**
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
 */
export class Microsoft implements Provider {
	name = 'microsoft';
	options: MicrosoftOptions;
	authUrl = `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`;
	tokenUrl = `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`;
	redirectUri: string;

	constructor(options: MicrosoftOptions) {
		this.options = options;
		this.authUrl = this.authUrl.replace('{tenant}', this.options.TENANT ?? 'consumers');
		this.tokenUrl = this.tokenUrl.replace('{tenant}', this.options.TENANT ?? 'consumers');
		this.redirectUri = `${this.options.BASE_URL}/accounted4/${this.name}`;

		// Build auth url
		this.authUrl = `${this.authUrl}?`.concat(encodeObjectAsParams({
			client_id: this.options.CLIENT_ID,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			scope: 'openid '.concat(this.options.SCOPES?.join(' ') || '').trim()
		}));
	}

	onSuccess(req: Request, res: Response, next: NextFunction) {
		axios
			.post(this.tokenUrl, encodeObjectAsParams({
				code: req.query.code,
				client_id: this.options.CLIENT_ID,
				client_secret: this.options.CLIENT_SECRET,
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
