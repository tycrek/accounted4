import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { Provider } from '../Provider';

interface DiscordOptions {
	BASE_URL: string;
	CLIENT_ID: string;
	CLIENT_SECRET: string;
	SCOPES?: string[];
}

export class Discord implements Provider {
	name = 'discord';
	options: DiscordOptions;
	authUrl = 'https://discord.com/api/v8/oauth2/authorize';
	tokenUrl = 'https://discord.com/api/oauth2/token';

	constructor(options: DiscordOptions) {
		this.options = options;

		// Build auth url
		this.authUrl = `${this.authUrl}?`.concat(encodeObjectAsParams({
			client_id: this.options.CLIENT_ID,
			redirect_uri: this.options.BASE_URL.concat('/accounted4/success/discord'),
			response_type: 'code',
			scope: 'identify '.concat(this.options.SCOPES?.join(' ') || '').trim()
		}));
	}

	onSuccess(req: Request, res: Response, next: NextFunction) {
		axios
			.post(this.tokenUrl, encodeObjectAsParams({
				code: req.query.code,
				client_id: this.options.CLIENT_ID,
				client_secret: this.options.CLIENT_SECRET,
				redirect_uri: this.options.BASE_URL.concat('/accounted4/success/discord'),
				grant_type: 'authorization_code',
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
