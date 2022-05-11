import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { getTokenFromCode, Provider, ProviderOptions } from '../Provider';

export interface GoogleOptions extends ProviderOptions {
}

/**
 * https://developers.google.com/identity/protocols/oauth2/web-server#obtainingaccesstokens
 */
export class Google implements Provider {
	name = 'google';
	baseUrl: string;
	options: GoogleOptions;
	authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
	tokenUrl = ' https://oauth2.googleapis.com/token';
	redirectUri: string;

	constructor(baseUrl: string, options: GoogleOptions) {
		this.baseUrl = baseUrl;
		this.options = options;
		this.redirectUri = `${this.baseUrl}/accounted4/${this.name}`;

		// Build auth url
		this.authUrl = `${this.authUrl}?`.concat(encodeObjectAsParams({
			client_id: this.options.clientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			scope: 'openid '.concat(this.options.scopes?.join(' ') || '').trim()
		}));
	}

	onSuccess(req: Request, res: Response, next: NextFunction) {
		getTokenFromCode(this, req, res, next, this.tokenUrl,
			encodeObjectAsParams({
				code: req.query.code,
				client_id: this.options.clientId,
				client_secret: this.options.clientSecret,
				redirect_uri: this.redirectUri,
				grant_type: 'authorization_code'
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
