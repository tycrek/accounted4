import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { Provider } from '../Provider';

interface GoogleOptions {
	BASE_URL: string;
	CLIENT_ID: string;
	CLIENT_SECRET: string;
	SCOPES?: string[];
}

/**
 * https://developers.google.com/identity/protocols/oauth2/web-server#obtainingaccesstokens
 */
export class Google implements Provider {
	name = 'google';
	options: GoogleOptions;
	authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
	tokenUrl = ' https://oauth2.googleapis.com/token';
	redirectUri: string;

	constructor(options: GoogleOptions) {
		this.options = options;
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
				grant_type: 'authorization_code'
			}))
			.then(({ data }) =>
				req.session.accounted4 = {
					provider: this.name,
					token: data.access_token
				})
			.then(() => res.redirect(req.session?.postAuthPath ?? '/'))
			.catch(next);
	}
}
