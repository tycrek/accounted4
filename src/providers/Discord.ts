import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { getTokenFromRefresh, getTokenFromCode, Provider, ProviderOptions } from '../Provider';

type DISCORD_SCOPES =
	'activities.read' |
	'activities.write' |
	'applications.builds.read' |
	'applications.builds.upload' |
	'applications.commands' |
	'applications.commands.update' |
	'applications.commands.permissions.update' |
	'applications.entitlements' |
	'applications.store.update' |
	'bot' |
	'connections' |
	'email' |
	'gdm.join' |
	'guilds' |
	'guilds.join' |
	'guilds.members.read' |
	'identify' |
	'messages.read' |
	'relationships.read' |
	'rpc' |
	'rpc.activities.write' |
	'rpc.notifications.read' |
	'rpc.voice.read' |
	'rpc.voice.write' |
	'webhook.incoming';

export interface DiscordOptions extends ProviderOptions {
	scopes?: DISCORD_SCOPES[] | string[];

	/**
	 * Defaults to `consent`. From [Discord OAuth2 docs](https://discord.com/developers/docs/topics/oauth2#authorization-code-grant):
	 * 
	 * > Controls how the authorization flow handles existing authorizations. If a user has previously authorized your application with the requested scopes and `prompt` is set to `consent`, it will request them to reapprove their authorization. If set to `none`, it will skip the authorization screen and redirect them back to your redirect URI without requesting their authorization.
	 */
	prompt?: 'none' | 'consent';
}

/**
 * https://discord.com/developers/docs/topics/oauth2
 */
export class Discord implements Provider {
	name = 'discord';
	baseUrl: string;
	options: DiscordOptions;
	authUrl = 'https://discord.com/api/v8/oauth2/authorize';
	tokenUrl = 'https://discord.com/api/v8/oauth2/token';
	refreshUrl = 'https://discord.com/api/v8/oauth2/refresh';
	redirectUri: string;

	constructor(baseUrl: string, options: DiscordOptions) {
		this.baseUrl = baseUrl;
		this.options = options;
		this.redirectUri = `${this.baseUrl}/accounted4/${this.name}`;

		// Build auth url
		this.authUrl = `${this.authUrl}?`.concat(encodeObjectAsParams({
			client_id: this.options.clientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			scope: 'identify '.concat(this.options.scopes?.join(' ') || '').trim(),
			prompt: this.options.prompt ?? 'consent',
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

	doRefresh(req: Request): Promise<any> {
		return getTokenFromRefresh(this, req, this.refreshUrl,
			encodeObjectAsParams({
				refresh_token: req.session.accounted4!.refreshToken,
				client_id: this.options.clientId,
				client_secret: this.options.clientSecret,
				grant_type: 'refresh_token',
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
