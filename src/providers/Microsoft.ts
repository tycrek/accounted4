import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { Provider, ProviderOptions } from '../Provider';

/**
 * See ["Request an authorization code"](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow#request-an-authorization-code) for more info on available options.
 */
export interface MicrosoftOptions extends ProviderOptions {
	/**
	 * Defaults to consumers.
	 */
	tenant?: 'consumers' | 'organizations' | 'common';

	/**
	 * Indicates the type of user interaction that is required.
	 */
	prompt?: 'login' | 'none' | 'consent' | 'select_account';

	/**
	 * You can use this parameter to pre-fill the username and email address field of the sign-in page for the user. Apps can use this parameter during reauthentication, after already extracting the `login_hint` [optional claim](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-optional-claims) from an earlier sign-in.
	 */
	loginHint?: string;

	/**
	 * If included, the app skips the email-based discovery process that user goes through on the sign-in page, leading to a slightly more streamlined user experience. For example, sending them to their federated identity provider. Apps can use this parameter during reauthentication, by extracting the `tid` from a previous sign-in.
	 */
	domainHint?: string;
}

/**
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
 */
export class Microsoft implements Provider {
	name = 'microsoft';
	baseUrl: string;
	options: MicrosoftOptions;
	authUrl = `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`;
	tokenUrl = `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`;
	redirectUri: string;

	constructor(baseUrl: string, options: MicrosoftOptions) {
		this.baseUrl = baseUrl;
		this.options = options;
		this.authUrl = this.authUrl.replace('{tenant}', this.options.tenant ?? 'consumers');
		this.tokenUrl = this.tokenUrl.replace('{tenant}', this.options.tenant ?? 'consumers');
		this.redirectUri = `${this.baseUrl}/accounted4/${this.name}`;

		// Build auth url
		this.authUrl = `${this.authUrl}?`.concat(encodeObjectAsParams({
			client_id: this.options.clientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			scope: 'openid '.concat(this.options.scopes?.join(' ') || '').trim()
		}));

		// Append additional options
		if (this.options.prompt) this.authUrl = `${this.authUrl}&prompt=${this.options.prompt}`;
		if (this.options.loginHint) this.authUrl = `${this.authUrl}&login_hint=${this.options.loginHint}`;
		if (this.options.domainHint) this.authUrl = `${this.authUrl}&domain_hint=${this.options.domainHint}`;
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
