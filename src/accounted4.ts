import { Options } from './Options';
import { Provider } from './Provider';
import { Express, Request, Response, NextFunction } from 'express';

// Providers
import { Discord } from './providers/Discord';
export const Providers = {
	Discord
};

export interface ac4session {
	/**
	 * Name of provider being used
	 */
	provider: string;

	/**
	 * accounted4 session token
	 */
	token: string;
}

export class Accounted4 {
	provider: Provider;
	options: Options;

	constructor(app: Express, provider: Provider, options: Options) {
		this.provider = provider;

		this.options = {
			hostname: options.hostname,
			port: options.port ?? (options.useHttps ? 443 : 80),
			useHttps: options.useHttps ?? false
		};

		// Success callback
		app.get(`/accounted4/success/:providerName`, (req, res, next) => {
			let provider = req.params.providerName;
			this.provider.onSuccess(req, res, next);
		});
	}

	/** 
	 * Middleware
	 */
	auth() {
		return (req: Request, res: Response, next: NextFunction) => {
			if (req.session.accounted4 && req.session.accounted4.token) {
				console.log(`Session ${req.session.id} authenticated with Provider: ${req.session.accounted4.provider}`);
				next();
			} else {
				console.log(`Session ${req.session.id} not authenticated`);
				req.session.postAuthPath = req.originalUrl;
				res.redirect(this.provider.authUrl)
			}
		};
	}

	static buildBaseUrl(hostname: string): string;
	static buildBaseUrl(hostname: string, useHttps: boolean): string;
	static buildBaseUrl(hostname: string, useHttps: boolean, port: number): string;
	static buildBaseUrl(hostname?: string, useHttps?: boolean, port?: number) {
		return `${useHttps ? 'https' : 'http'}://${hostname}${!useHttps && port !== 80 && port !== 443 ? `:${port}` : ''}`;
	}
}

export function encodeObjectAsParams(obj: { [key: string]: any }) {
	return Object.entries(obj).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
}
