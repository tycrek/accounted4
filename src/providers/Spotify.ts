import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { Provider } from '../Provider';

interface SpotifyOptions {
	BASE_URL: string;
	CLIENT_ID: string;
	CLIENT_SECRET: string;
	SCOPES?: string[];
}

/**
 * https://developer.spotify.com/documentation/general/guides/authorization/code-flow/
 */
export class Spotify implements Provider {
	name = 'spotify';
	options: SpotifyOptions;
	authUrl = 'https://accounts.spotify.com/authorize';
	tokenUrl = 'https://accounts.spotify.com/api/token';
	redirectUri: string;

	constructor(options: SpotifyOptions) {
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
				redirect_uri: this.redirectUri,
				grant_type: 'authorization_code',
			}), { headers: { Authorization: `Basic ${Buffer.from(`${this.options.CLIENT_ID}:${this.options.CLIENT_SECRET}`).toString('base64')}` } })
			.then(({ data }) =>
				req.session.accounted4 = {
					provider: this.name,
					token: data.access_token
				})
			.then(() => res.redirect(req.session?.postAuthPath ?? '/'))
			.catch(next);
	}
}
