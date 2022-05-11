import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { encodeObjectAsParams } from '../accounted4';
import { Provider, ProviderOptions } from '../Provider';

type SPOTIFY_SCOPES =
	'ugc-image-upload' |
	'user-modify-playback-state' |
	'user-read-playback-state' |
	'user-read-currently-playing' |
	'user-follow-modify' |
	'user-follow-read' |
	'user-read-recently-played' |
	'user-read-playback-position' |
	'user-top-read' |
	'playlist-read-collaborative' |
	'playlist-modify-public' |
	'playlist-read-private' |
	'playlist-modify-private' |
	'app-remote-control' |
	'streaming' |
	'user-read-email' |
	'user-read-private' |
	'user-library-modify' |
	'user-library-read';

export interface SpotifyOptions extends ProviderOptions {
	scopes?: SPOTIFY_SCOPES[] | string[];

	/**
	 * Defaults to `false`. From [Spotify OAuth2 docs](https://developer.spotify.com/documentation/general/guides/authorization/code-flow/#request-user-authorization):
	 * 
	 * > Whether or not to force the user to approve the app again if they’ve already done so. If `false` (default), a user who has already approved the application may be automatically redirected to the URI specified by `redirect_uri`. If `true`, the user will not be automatically redirected and will have to approve the app again.
	 */
	show_dialog?: boolean;
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
			scope: ''.concat(this.options.scopes?.join(' ') || '').trim(),
			show_dialog: this.options.show_dialog ?? false,
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
					created: Date.now() / 1000,
					provider: this.name,
					token: data.access_token
				};
			})
			.then(() => res.redirect(req.session?.postAuthPath ?? '/'))
			.catch(next);
	}
}
