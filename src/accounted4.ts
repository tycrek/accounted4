import { Options, Providers, ProviderNames } from './Options';
import { Provider } from './Provider';
import { Express, Request, Response, NextFunction } from 'express';

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
	baseUrl: string;
	providers: { [key: string]: Provider };
	options: Options;

	constructor(app: Express, options: Options) {
		this.options = {
			hostname: options.hostname,
			port: options.port ?? (options.useHttps ? 443 : 80),
			useHttps: options.useHttps ?? false,
			defaultProvider: options.defaultProvider,
			optionalProviders: options.optionalProviders ?? [],
			providerOptions: options.providerOptions,
		};

		// Set base URL
		this.baseUrl = Accounted4.buildBaseUrl(this.options.hostname, this.options.useHttps, this.options.port);

		// Build providers
		this.providers = {};
		const checkProvider = (provider: ProviderNames) => {
			let providerOptions = this.options.providerOptions[provider];
			if (!providerOptions) throw new Error(`Provider ${provider} does not have options`);
			this.providers[provider.toLowerCase()] = new Providers[provider](this.baseUrl, providerOptions);
		};

		// Check default provider
		checkProvider(this.options.defaultProvider);

		// Check optional providers
		this.options.optionalProviders?.forEach(checkProvider);

		// Set success callbacks
		app.get(`/accounted4/:providerName`, (req, res, next) => {
			let provider = req.params.providerName;
			if (!this.providers[provider.toLowerCase()]) next(new Error(`Provider ${provider} not found`));
			this.providers[provider.toLowerCase()].onSuccess(req, res, next);
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
				res.redirect(this.providers[this.options.defaultProvider.toLowerCase()].authUrl)
			}
		};
	}

	static buildBaseUrl(hostname: string): string;
	static buildBaseUrl(hostname: string, useHttps?: boolean): string;
	static buildBaseUrl(hostname: string, useHttps?: boolean, port?: number): string;
	static buildBaseUrl(hostname?: string, useHttps?: boolean, port?: number) {
		return `${useHttps ? 'https' : 'http'}://${hostname}${!useHttps && port !== 80 && port !== 443 ? `:${port}` : ''}`;
	}
}

export function encodeObjectAsParams(obj: { [key: string]: any }) {
	return Object.entries(obj).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
}
