import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { getTokenFromCode, Provider, ProviderOptions } from '../Provider';

type GITHUB_SCOPES =
	'repo' |
	'repo:status' |
	'repo_deployment' |
	'public_repo' |
	'repo:invite' |
	'security_events' |
	'admin:repo_hook' |
	'write:repo_hook' |
	'read:repo_hook' |
	'admin:org' |
	'write:org' |
	'read:org' |
	'admin:public_key' |
	'write:public_key' |
	'read:public_key' |
	'admin:org_hook' |
	'gist' |
	'notifications' |
	'user' |
	'read:user' |
	'user:email' |
	'user:follow' |
	'delete_repo' |
	'write:discussion' |
	'read:discussion' |
	'write:packages' |
	'read:packages' |
	'delete:packages' |
	'admin:gpg_key' |
	'write:gpg_key' |
	'read:gpg_key' |
	'codespace' |
	'workflow';

/**
 * See ["Request a user's GitHub identity"](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#parameters) for more info on available options.
 */
export interface GitHubOptions extends ProviderOptions {
	scopes?: GITHUB_SCOPES[] | string[];

	/**
	 * Suggests a specific account to use for signing in and authorizing the app.
	 */
	login?: string;

	/**
	 * Whether or not unauthenticated users will be offered an option to sign up for GitHub during the OAuth flow. The default is `true`. Use `false` when a policy prohibits signups.
	 */
	allow_signup?: boolean;
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

		// Append additional options
		if (this.options.login) this.authUrl = `${this.authUrl}&login=${this.options.login}`;
		if (this.options.allow_signup) this.authUrl = `${this.authUrl}&allow_signup=${this.options.allow_signup}`;
	}

	onSuccess(req: Request, res: Response, next: NextFunction) {
		getTokenFromCode(this, req, res, next, this.tokenUrl,
			encodeObjectAsParams({
				code: req.query.code,
				client_id: this.options.clientId,
				client_secret: this.options.clientSecret,
				redirect_uri: this.redirectUri,
			}),
			this.sessionDataSchema,
			{ Accept: 'application/json' });
	}

	sessionDataSchema(provider: Provider, data: any) {
		return {
			created: Date.now() / 1000,
			provider: provider.name,
			token: data.access_token
		};
	}
}
