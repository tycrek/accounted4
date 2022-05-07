import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { Provider, ProviderOptions } from '../Provider';

export interface SpotifyOptions extends ProviderOptions {
}

/**
 * https://developer.spotify.com/documentation/general/guides/authorization/code-flow/
 */
export class Spotify implements Provider {
	name = 'spotify';
	baseUrl: string;
	options: SpotifyOptions;
	authUrl = 'https://accounts.spotify.com/authorize';
	tokenUrl = 'https://accounts.spotify.com/api/token';
	redirectUri: string;

	constructor(baseUrl: string, options: SpotifyOptions) {
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
				redirect_uri: this.redirectUri,
				grant_type: 'authorization_code',
			}), { headers: { Authorization: `Basic ${Buffer.from(`${this.options.clientId}:${this.options.clientSecret}`).toString('base64')}` } })
			.then(({ data }) => {
				if (data.error) throw new Error(data.error);
				req.session.accounted4 = {
					provider: this.name,
					token: data.access_token
				};
			})
			.then(() => res.redirect(req.session?.postAuthPath ?? '/'))
			.catch(next);
	}
}
