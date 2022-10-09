import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { getTokenFromRefresh, getTokenFromCode, Provider, ProviderOptions } from '../Provider';

type DIGITAL_OCEAN_SCOPES = 'read' | 'write';

export interface DigitalOceanOptions extends ProviderOptions {
	scopes?: DIGITAL_OCEAN_SCOPES[] | string[];

	/**
	 * A space-separated list of strings that dictate how the user is requested to authorize their account. Defaults to `select_account`. For more information on accepted values, see [Digital Ocean OAuth2 docs](https://docs.digitalocean.com/reference/api/oauth-api/#prompt-parameter).
	 */
	prompt?: 'none' | 'login' | 'select_account';

	/**
	 * The maximum age, in seconds, of a user’s signed-in session, after which the user should be required to sign-in again before authentication your application.
	 */
	max_auth_age?: number;
}

/**
 * https://docs.digitalocean.com/reference/api/oauth-api/
 */
export class DigitalOcean implements Provider {
	name = 'digitalocean';
	baseUrl: string;
	options: DigitalOceanOptions;
	authUrl = 'https://cloud.digitalocean.com/v1/oauth/authorize';
	tokenUrl = 'https://cloud.digitalocean.com/v1/oauth/token';
	refreshUrl = this.tokenUrl;
	redirectUri: string;

	constructor(baseUrl: string, options: DigitalOceanOptions) {
		this.baseUrl = baseUrl;
		this.options = options;
		this.redirectUri = `${this.baseUrl}/accounted4/${this.name}`;

		// Build auth url
		this.authUrl = `${this.authUrl}?`.concat(encodeObjectAsParams({
			client_id: this.options.clientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			scope: 'read '.concat(this.options.scopes?.join(' ') || '').trim(),
			prompt: this.options.prompt ?? 'select_account',
			max_auth_age: this.options.max_auth_age,
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

	doRefresh(req: Request): Promise<any> {
		return getTokenFromRefresh(this, req, this.refreshUrl,
			encodeObjectAsParams({
				refresh_token: req.session.accounted4!.refreshToken,
				client_id: this.options.clientId,
				client_secret: this.options.clientSecret,
				grant_type: 'refresh_token'
			}), this.sessionDataSchema);
	}

	sessionDataSchema(provider: Provider, data: any) {
		return {
			created: Date.now() / 1000,
			provider: provider.name,
			token: data.access_token,
			refreshToken: data.refresh_token,
			expiresIn: data.expires_in,
		};
	}
}